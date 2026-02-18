'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabaseClient } from '@/lib/supabase'

interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export default function ImportKeywordsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importedCount, setImportedCount] = useState(0)

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
        
        // Mapear columnas comunes
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
        let imported = 0
        
        for (const line of rows) {
          const cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          
          const keywordData = {
            keyword: keywordIndex >= 0 ? cells[keywordIndex] : cells[0],
            search_volume: volumeIndex >= 0 ? parseInt(cells[volumeIndex]) || 0 : 0,
            difficulty: difficultyIndex >= 0 ? parseInt(cells[difficultyIndex]) || null : null,
            source: 'csv_import',
            raw_data: Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']))
          }

          const { error } = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .insert(keywordData)

          if (!error) imported++
        }

        setImportedCount(imported)
        setSuccess(`Importación completada: ${imported} keywords importadas`)
        setImporting(false)
      }
      reader.readAsText(file)
    } catch (err) {
      setError('Error durante la importación: ' + (err as Error).message)
      setImporting(false)
    }
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
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

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

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Formato esperado del CSV:</h3>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Primera fila: encabezados (Keyword, Volume, Difficulty, etc.)</li>
          <li>Columna de keyword: detectada automáticamente (busca "keyword", "palabra", "kw")</li>
          <li>Columna de volumen: detectada automáticamente (busca "volume", "volumen", "search")</li>
          <li>Columna de dificultad: detectada automáticamente (busca "difficulty", "dificultad", "kd")</li>
        </ul>
      </div>
    </div>
  )
}
