'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabaseClient } from '@/lib/supabase'
import { analyzeKeywordsWithAI, AIKeywordAnalysis } from '@/lib/ai-analysis'
import { Brain, Loader2, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

interface ImportedKeyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number | null
}

export default function ImportKeywordsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [importedKeywords, setImportedKeywords] = useState<ImportedKeyword[]>([])
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, message: '' })
  const [analysisResults, setAnalysisResults] = useState<AIKeywordAnalysis[] | null>(null)
  const [clustersCreated, setClustersCreated] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (csvFile) {
      setFile(csvFile)
      parseCSV(csvFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  const parseCSV = (csvFile: File) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setShowAnalysisOptions(false)
    setImportedKeywords([])
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setError('El archivo CSV está vacío o no tiene datos')
          setLoading(false)
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
        const rows = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        )

        setPreview({
          headers,
          rows,
          totalRows: lines.length - 1
        })
        setLoading(false)
      } catch (err) {
        setError('Error al parsear el CSV: ' + (err as Error).message)
        setLoading(false)
      }
    }
    reader.readAsText(csvFile)
  }

  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    setError('')
    setSuccess('')
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
        
        const keywordIndex = headers.findIndex(h => 
          h.toLowerCase().includes('keyword') || 
          h.toLowerCase().includes('palabra') ||
          h.toLowerCase() === 'kw'
        )
        
        const volumeIndex = headers.findIndex(h => 
          h.toLowerCase().includes('volume') || 
          h.toLowerCase().includes('volumen') ||
          h.toLowerCase().includes('search')
        )
        
        const difficultyIndex = headers.findIndex(h => 
          h.toLowerCase().includes('difficulty') || 
          h.toLowerCase().includes('dificultad') ||
          h.toLowerCase().includes('kd')
        )

        const rows = lines.slice(1)
        const importedKeywordsList: ImportedKeyword[] = []
        let imported = 0
        
        for (const line of rows) {
          const cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          
          const keywordText = keywordIndex >= 0 ? cells[keywordIndex] : cells[0]
          const searchVolume = volumeIndex >= 0 ? parseInt(cells[volumeIndex]) || 0 : 0
          const difficulty = difficultyIndex >= 0 ? parseInt(cells[difficultyIndex]) || null : null
          
          const keywordData = {
            keyword: keywordText,
            search_volume: searchVolume,
            difficulty: difficulty,
            source: 'csv_import',
            raw_data: Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']))
          }

          const { data, error } = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .insert(keywordData)
            .select('id, keyword, search_volume, difficulty')
            .single()

          if (!error && data) {
            imported++
            importedKeywordsList.push(data)
          }
        }

        setImportedCount(imported)
        setImportedKeywords(importedKeywordsList)
        setSuccess(`${imported} keywords importadas correctamente`)
        setShowAnalysisOptions(true)
        setImporting(false)
      }
      reader.readAsText(file)
    } catch (err) {
      setError('Error durante la importación: ' + (err as Error).message)
      setImporting(false)
    }
  }

  const runAIAnalysis = async () => {
    if (importedKeywords.length === 0) return
    
    setAnalyzing(true)
    setError('')
    
    try {
      const keywordTexts = importedKeywords.map(k => k.keyword)
      setAnalysisProgress({ 
        current: 0, 
        total: Math.ceil(keywordTexts.length / 50), 
        message: 'Analizando keywords con Gemini...' 
      })
      
      const result = await analyzeKeywordsWithAI(keywordTexts)
      
      if (!result.success) {
        throw new Error(result.error || 'Error en el análisis')
      }
      
      setAnalysisResults(result.analyses)
      setAnalysisProgress({ 
        current: result.batchesProcessed || 0, 
        total: result.batchesProcessed || 0, 
        message: `Análisis completado: ${result.totalAnalyzed} keywords procesadas` 
      })
      
      // Crear clusters automáticamente
      await createClustersFromAI(result.analyses)
      
    } catch (err: any) {
      setError('Error en análisis con IA: ' + err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const createClustersFromAI = async (analyses: AIKeywordAnalysis[]) => {
    try {
      // Agrupar por cluster
      const clusterGroups: { [key: string]: AIKeywordAnalysis[] } = {}
      analyses.forEach(analysis => {
        const clusterName = analysis.cluster
        if (!clusterGroups[clusterName]) {
          clusterGroups[clusterName] = []
        }
        clusterGroups[clusterName].push(analysis)
      })

      let createdCount = 0

      for (const [clusterName, clusterAnalyses] of Object.entries(clusterGroups)) {
        const firstAnalysis = clusterAnalyses[0]
        
        // Crear cluster
        const { data: cluster } = await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .insert({
            name: clusterName.replace(/_/g, ' '),
            description: `Cluster automático - Intención: ${firstAnalysis.intent} (${clusterAnalyses.length} keywords)`,
            keyword_count: clusterAnalyses.length,
            intent: firstAnalysis.intent
          })
          .select()
          .single()

        if (cluster) {
          createdCount++
          
          // Obtener IDs de keywords importadas
          const keywordTexts = clusterAnalyses.map(a => a.keyword)
          const keywordIds = importedKeywords
            .filter(k => keywordTexts.includes(k.keyword))
            .map(k => k.id)
          
          // Actualizar keywords
          if (keywordIds.length > 0) {
            await supabaseClient
              .from('d_seo_admin_raw_keywords')
              .update({ 
                cluster_id: cluster.id, 
                status: 'clustered',
                intent: firstAnalysis.intent
              })
              .in('id', keywordIds)
          }
        }
      }

      setClustersCreated(createdCount)
      setSuccess(`Importación y análisis completados:\n• ${importedCount} keywords importadas\n• ${createdCount} clusters creados automáticamente`)
      
      // Redirigir a clusters después de 3 segundos
      setTimeout(() => {
        router.push('/admin/keywords/clusters')
      }, 3000)
      
    } catch (err) {
      console.error('Error creating clusters:', err)
      setError('Error al crear clusters automáticamente')
    }
  }

  const skipAnalysis = () => {
    router.push('/admin/keywords/clusters')
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Importar Keywords</h2>
        <p className="text-gray-600">Sube un archivo CSV con tus keywords</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-green-800 whitespace-pre-line">{success}</p>
            {clustersCreated > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Redirigiendo a Clusters en 3 segundos...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Opciones de análisis después de importar */}
      {showAnalysisOptions && !analyzing && !analysisResults && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">
              Importación completada: {importedCount} keywords
            </h3>
          </div>
          <p className="text-purple-700 mb-4">
            ¿Quieres analizar estas keywords automáticamente con Gemini para crear clusters?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={runAIAnalysis}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>Sí, analizar con Gemini</span>
            </button>
            <button
              onClick={skipAnalysis}
              className="px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              No, ir a Clusters manualmente
            </button>
          </div>
        </div>
      )}

      {/* Progreso del análisis */}
      {analyzing && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900">
              Analizando keywords con Gemini...
            </h3>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-purple-700 mb-2">
              <span>{analysisProgress.message}</span>
              <span>{analysisProgress.current}/{analysisProgress.total} lotes</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.total > 0 ? (analysisProgress.current / analysisProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-purple-600">
            Esto puede tardar unos minutos dependiendo de la cantidad de keywords...
          </p>
        </div>
      )}

      {/* Resultados del análisis */}
      {analysisResults && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              Análisis completado
            </h3>
          </div>
          <div className="space-y-2 text-green-800">
            <p>• {analysisResults.length} keywords analizadas</p>
            <p>• {clustersCreated} clusters creados automáticamente</p>
          </div>
          <button
            onClick={() => router.push('/admin/keywords/clusters')}
            className="mt-4 flex items-center space-x-2 text-purple-700 hover:text-purple-900 font-medium"
          >
            <span>Ver clusters creados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!showAnalysisOptions && (
        <div className="bg-white shadow-md rounded-lg p-6">
          {!preview ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isDragActive ? (
                <p className="text-indigo-600">Suelta el archivo aquí...</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">Arrastra y suelta un archivo CSV aquí</p>
                  <p className="text-sm text-gray-400">o haz clic para seleccionar</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{file?.name}</p>
                  <p className="text-sm text-gray-500">{preview.totalRows} filas encontradas</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.totalRows > 5 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    ... y {preview.totalRows - 5} filas más
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {importing ? 'Importando...' : `Importar ${preview.totalRows} keywords`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Nuevo: Análisis automático con Gemini</h3>
        <p className="text-sm text-gray-600 mb-2">
          Después de importar tus keywords, el sistema te ofrecerá analizarlas automáticamente con Gemini para crear clusters inteligentes.
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Detección de intención de búsqueda (informacional, transaccional, comercial, navegacional)</li>
          <li>Agrupación semántica automática en clusters temáticos</li>
          <li>Sugerencias de tipo de contenido para cada keyword</li>
          <li>Procesamiento en lotes para archivos grandes</li>
        </ul>
      </div>
    </div>
  )
}
