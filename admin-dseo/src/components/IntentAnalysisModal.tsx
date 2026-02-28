'use client'

import { useState } from 'react'
import { detectSearchIntent, getIntentBadge, SearchIntent } from '@/lib/search-intent'
import { analyzeKeywordsWithAI, AICluster, AIAnalysisResult, AIKeywordAnalysis } from '@/lib/ai-analysis'
import { cleanKeywordsForAI, calculateProcessingStrategy, formatTokenSavings } from '@/lib/keyword-cleaner'
import ModelSelector from '@/components/ModelSelector'
import { X, Info, AlertCircle, Brain, Loader2, CheckCircle, Sparkles, Trash2 } from 'lucide-react'

interface KeywordData {
  id: string
  keyword: string
  search_volume: number
  difficulty: number
}

function convertToLegacyFormat(results: AIAnalysisResult): AIKeywordAnalysis[] {
  const analyses: AIKeywordAnalysis[] = []
  
  for (const cluster of results.clusters) {
    for (const keyword of cluster.keywords) {
      analyses.push({
        keyword,
        cluster: cluster.name,
        intent: cluster.intent as SearchIntent,
        confidence: 0.8,
        reasoning: `Part of cluster "${cluster.name}"`,
        contentType: cluster.is_pillar ? 'landing' : 'blog'
      })
    }
  }
  
  return analyses
}

interface IntentAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  intent: SearchIntent
  keywords: KeywordData[]
  onApplyAIAnalysis?: (results: AIAnalysisResult) => void
}

interface CleaningResult {
  originalCount: number
  cleanedCount: number
  duplicatesRemoved: number
  tokensSaved: number
}

export default function IntentAnalysisModal({ 
  isOpen, 
  onClose, 
  intent, 
  keywords,
  onApplyAIAnalysis 
}: IntentAnalysisModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [showAIResults, setShowAIResults] = useState(false)
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null)
  
  // Model selection
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedApiKeyEnvVar, setSelectedApiKeyEnvVar] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  
  if (!isOpen) return null

  const badge = getIntentBadge(intent || 'unknown')
  
  // Analizar cada keyword para mostrar por qué se clasificó así
  const analyzedKeywords = keywords.map(kw => {
    const analysis = detectSearchIntent(kw.keyword)
    return {
      ...kw,
      ...analysis
    }
  })

  const filteredKeywords = analyzedKeywords.filter(kw => 
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const runAIAnalysis = async () => {
    setAnalyzing(true)
    setAiError(null)
    setCleaningResult(null)
    
    try {
      // 1. Limpiar keywords
      setProgress({ current: 0, total: 0, message: 'Limpiando keywords...' })
      const cleaned = cleanKeywordsForAI(keywords.map(k => k.keyword))
      
      setCleaningResult({
        originalCount: cleaned.stats.originalCount,
        cleanedCount: cleaned.stats.cleanedCount,
        duplicatesRemoved: cleaned.stats.duplicatesRemoved,
        tokensSaved: cleaned.stats.tokensSaved
      })
      
      // 2. Calcular estrategia
      const strategy = calculateProcessingStrategy(cleaned.cleanedKeywords.length)
      setProgress({ 
        current: 0, 
        total: strategy.estimatedBatches, 
        message: `Analizando ${cleaned.cleanedKeywords.length} keywords en ${strategy.estimatedBatches} lotes...` 
      })
      
      // 3. Analizar con IA
      const result = await analyzeKeywordsWithAI(cleaned.cleanedKeywords, undefined, {
        model: selectedModel,
        provider: selectedProvider,
        apiKeyEnvVar: selectedApiKeyEnvVar
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error en el análisis')
      }
      
      setAiResults(result)
      setShowAIResults(true)
      setProgress({ 
        current: result.batchesProcessed || 0, 
        total: result.batchesProcessed || 0, 
        message: `¡Análisis completado! ${result.totalAnalyzed} keywords procesadas` 
      })
    } catch (err: any) {
      setAiError(err.message || 'Error desconocido')
      setProgress({ current: 0, total: 0, message: '' })
    } finally {
      setAnalyzing(false)
    }
  }

  const applyAIResults = async () => {
    if (!aiResults || !onApplyAIAnalysis || applying) return
    
    setApplying(true)
    try {
      await onApplyAIAnalysis(aiResults)
      // El modal se cierra automáticamente cuando el padre llama a onClose
    } catch (error) {
      console.error('Error applying AI results:', error)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.label}
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Análisis de {keywords.length} keywords
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Model Selector */}
          <div className="flex items-center space-x-4">
            <ModelSelector 
              currentTask="cluster"
              onModelChange={(model, provider, apiKeyEnvVar) => {
                setSelectedModel(model)
                setSelectedProvider(provider)
                setSelectedApiKeyEnvVar(apiKeyEnvVar || '')
              }}
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {!showAIResults && (
              <button
                onClick={runAIAnalysis}
                disabled={analyzing || !selectedModel}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedModel ? 'Selecciona un modelo primero' : ''}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Analizar Clusters</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resultados de limpieza */}
        {cleaningResult && cleaningResult.duplicatesRemoved > 0 && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-900">
                Limpieza completada
              </h4>
              <p className="text-sm text-green-700">
                {cleaningResult.duplicatesRemoved} duplicados eliminados • {formatTokenSavings(cleaningResult.tokensSaved)} tokens ahorrados
              </p>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {analyzing && progress.total > 0 && (
          <div className="mx-6 mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.message}</span>
              <span>{progress.current}/{progress.total} lotes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {aiError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Error en análisis con IA</h4>
              <p className="text-sm text-red-700 mt-1">{aiError}</p>
              <p className="text-xs text-red-600 mt-2">
                Asegúrate de haber configurado GOOGLE_AI_API_KEY en las variables de entorno.
              </p>
            </div>
          </div>
        )}

        {/* AI Results Toggle */}
        {aiResults && (
          <div className="px-6 py-3 border-b bg-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-900">
                Análisis de Gemini completado para {aiResults.totalAnalyzed} keywords • {aiResults.clusters.length} clusters
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAIResults(!showAIResults)}
                className="text-sm text-purple-700 hover:text-purple-900 underline"
              >
                {showAIResults ? 'Ver análisis original' : 'Ver análisis IA'}
              </button>
              {onApplyAIAnalysis && (
                <button
                  onClick={applyAIResults}
                  disabled={applying}
                  className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Aplicando...</span>
                    </>
                  ) : (
                    <span>Aplicar resultados</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Buscar keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showAIResults && aiResults ? (
            <AIResultsView 
              analyses={convertToLegacyFormat(aiResults).filter(a => 
                a.keyword.toLowerCase().includes(searchTerm.toLowerCase())
              )} 
            />
          ) : (
            <OriginalAnalysisView 
              patternsMap={groupByPatterns(filteredKeywords)}
              filteredKeywords={filteredKeywords}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper para agrupar por patrones
function groupByPatterns(keywords: any[]) {
  const patternsMap = new Map<string, any[]>()
  keywords.forEach(kw => {
    const patternKey = kw.matches?.length > 0 ? kw.matches.join(', ') : 'Sin patrón detectado'
    if (!patternsMap.has(patternKey)) {
      patternsMap.set(patternKey, [])
    }
    patternsMap.get(patternKey)!.push(kw)
  })
  return patternsMap
}

// Sub-componente para mostrar resultados de IA
function AIResultsView({ analyses }: { analyses: AIKeywordAnalysis[] }) {
  // Agrupar por cluster
  const clusterGroups = new Map<string, AIKeywordAnalysis[]>()

  analyses.forEach(analysis => {
    const cluster = analysis.cluster
    if (!clusterGroups.has(cluster)) {
      clusterGroups.set(cluster, [])
    }
    clusterGroups.get(cluster)!.push(analysis)
  })

  return (
    <div className="space-y-6">
      {/* Clusters sugeridos */}
      {Array.from(clusterGroups.entries()).map(([clusterName, items]) => (
        <div key={clusterName} className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            Cluster: {clusterName.replace(/_/g, ' ')}
            <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
              {items.length} keywords
            </span>
          </h3>
          <div className="bg-white rounded p-3">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2">Keyword</th>
                  <th className="pb-2">Intención</th>
                  <th className="pb-2">Tipo Contenido</th>
                  <th className="pb-2">Confianza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const badge = getIntentBadge(item.intent || 'unknown')
                  return (
                    <tr key={idx} className="text-sm">
                      <td className="py-2 text-gray-900 font-medium">{item.keyword}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 capitalize">{item.contentType}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                          item.confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// Sub-componente para análisis original
function OriginalAnalysisView({ 
  patternsMap, 
  filteredKeywords 
}: { 
  patternsMap: Map<string, any[]>
  filteredKeywords: any[]
}) {
  return (
    <>
      {/* Stats */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold">{filteredKeywords.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Confianza alta (&gt;0.7): </span>
            <span className="font-semibold text-green-600">
              {filteredKeywords.filter((k: any) => k.confidence > 0.7).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confianza media (0.3-0.7): </span>
            <span className="font-semibold text-yellow-600">
              {filteredKeywords.filter((k: any) => k.confidence >= 0.3 && k.confidence <= 0.7).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confianza baja (&lt;0.3): </span>
            <span className="font-semibold text-red-600">
              {filteredKeywords.filter((k: any) => k.confidence < 0.3).length}
            </span>
          </div>
        </div>
      </div>

      {/* Keywords List */}
      {Array.from(patternsMap.entries()).map(([pattern, keywordsList]) => (
        <div key={pattern} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Patrón: {pattern}
          </h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2">Keyword</th>
                  <th className="pb-2">Confianza</th>
                  <th className="pb-2">Volumen</th>
                  <th className="pb-2">Dificultad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywordsList.map((kw: any) => (
                  <tr key={kw.id} className="text-sm">
                    <td className="py-2 text-gray-900">{kw.keyword}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        kw.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                        kw.confidence >= 0.3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(kw.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{kw.search_volume || '-'}</td>
                    <td className="py-2 text-gray-600">{kw.difficulty || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  )
}

interface UnknownKeywordsSectionProps {
  keywords: KeywordData[]
  onAnalyzeWithAI?: (keywords: string[]) => void
}

export function UnknownKeywordsSection({ keywords, onAnalyzeWithAI }: UnknownKeywordsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  
  if (keywords.length === 0) return null

  const handleAnalyze = async () => {
    if (!onAnalyzeWithAI) return
    
    setAnalyzing(true)
    try {
      await onAnalyzeWithAI(keywords.map(k => k.keyword))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900">
            {keywords.length} keywords con intención desconocida
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Estas keywords no coinciden con los patrones predefinidos. El análisis con Gemini puede clasificarlas mejor.
          </p>
          
          {isExpanded && (
            <div className="mt-3 max-h-48 overflow-y-auto bg-white rounded p-2">
              <ul className="text-sm text-gray-700 space-y-1">
                {keywords.slice(0, 20).map((kw) => (
                  <li key={kw.id}>{kw.keyword}</li>
                ))}
                {keywords.length > 20 && (
                  <li className="text-gray-500 italic">... y {keywords.length - 20} más</li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-3 flex space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              {isExpanded ? 'Ocultar lista' : 'Ver lista'}
            </button>
            {onAnalyzeWithAI && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center space-x-2 text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Analizar con Gemini</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
