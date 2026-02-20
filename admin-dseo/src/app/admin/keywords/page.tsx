'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { analyzeKeywordsWithAI, AIAnalysisResult } from '@/lib/ai-analysis'
import { 
  Loader2, Trash2, CheckSquare, Square, XCircle, RefreshCw, Sparkles, Eye, Check, X
} from 'lucide-react'

interface Keyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number | null
  status: string
  cluster_id: string | null
  intent: string | null
  created_at: string
}

interface Cluster {
  id: string
  name: string
}

function getIntentLabel(intent: string | null | undefined): string {
  if (!intent) return '-'
  return intent.charAt(0).toUpperCase() + intent.slice(1)
}

function getIntentBadgeColor(intent: string | null | undefined): string {
  const colors: Record<string, string> = {
    transactional: 'bg-blue-100 text-blue-800',
    commercial: 'bg-purple-100 text-purple-800',
    informational: 'bg-green-100 text-green-800',
    navigational: 'bg-yellow-100 text-yellow-800',
  }
  return colors[intent || ''] || 'bg-gray-100 text-gray-800'
}

function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (word.endsWith('ones')) return word.slice(0, -3)
      if (word.endsWith('os') || word.endsWith('as')) return word.slice(0, -2)
      if (word.endsWith('es') && word.length > 3) return word.slice(0, -2)
      if (word.endsWith('s') && word.length > 2) return word.slice(0, -1)
      return word
    })
    .join(' ')
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [cleaning, setCleaning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [applyingChanges, setApplyingChanges] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [keywordsRes, clustersRes, countRes] = await Promise.all([
        supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('*')
          .order('search_volume', { ascending: false })
          .limit(500),
        supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .select('id, name'),
        supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('id', { count: 'exact', head: true })
      ])

      setKeywords(keywordsRes.data || [])
      setClusters(clustersRes.data || [])
      setTotalCount(countRes.count || 0)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const cleanDatabase = async () => {
    if (!confirm('¿Limpiar la base de datos? Esto eliminará duplicados y keywords muy cortas.')) return

    setCleaning(true)
    try {
      const { data: allKeywords, error } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, status')

      if (error) throw error
      if (!allKeywords || allKeywords.length === 0) {
        alert('No hay keywords para limpiar')
        setCleaning(false)
        return
      }

      console.log('=== ANALISIS DE KEYWORDS ===')
      console.log('Total en BBDD:', allKeywords.length)
      
      const testKeywords = ['diseños web', 'diseño web', 'disenos web']
      testKeywords.forEach(kw => {
        console.log(`"${kw}" -> normalize -> "${normalizeKeyword(kw)}"`)
      })

      const normalizedMap: any = new Map()

      allKeywords.forEach((k: any) => {
        const kw = String(k.keyword || '').trim()
        if (kw.length < 3) return
        
        const norm = normalizeKeyword(kw)
        
        if (kw.toLowerCase().includes('dise')) {
          console.log(`Keyword: "${kw}" -> Normalizado: "${norm}"`)
        }
        
        if (normalizedMap.has(norm)) {
          const existing = normalizedMap.get(norm)!
          existing.volume += Number(k.search_volume) || 0
          existing.ids.push(k.id)
          existing.originals = [...(existing.originals || []), k.keyword]
        } else {
          normalizedMap.set(norm, { 
            originalId: k.id, 
            volume: Number(k.search_volume) || 0, 
            ids: [k.id],
            originals: [k.keyword]
          })
        }
      })

      const duplicates = Array.from(normalizedMap.entries() as [string, any][]).filter(([k, d]) => d.ids.length > 1)
      console.log('=== DUPLICADOS ENCONTRADOS ===')
      console.log('Total keywords procesadas:', allKeywords.length)
      console.log('Grupos de duplicados:', duplicates.length)
      duplicates.forEach(([norm, data]) => {
        console.log(`"${norm}":`, data.originals, '→', data.ids.length, 'keywords')
      })

      let duplicatesRemoved = 0
      const toDiscard: string[] = []
      const toUpdate: { id: string; volume: number }[] = []
      
      for (const [norm, data] of normalizedMap) {
        if (data.ids.length > 1) {
          toUpdate.push({ id: data.originalId, volume: data.volume })
          toDiscard.push(...data.ids.slice(1))
          duplicatesRemoved += data.ids.length - 1
        }
      }

      console.log('A descartar:', toDiscard)
      console.log('A actualizar:', toUpdate)

      if (toDiscard.length > 0) {
        const batchSize = 100
        for (let i = 0; i < toDiscard.length; i += batchSize) {
          const batch = toDiscard.slice(i, i + batchSize)
          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ status: 'discarded' })
            .in('id', batch)
        }
      }

      for (const update of toUpdate) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ search_volume: update.volume })
          .eq('id', update.id)
      }

      await fetchData()
      alert(`Limpieza completada:\n• ${duplicatesRemoved} duplicados eliminados`)
    } catch (err) {
      console.error('Error:', err)
      alert('Error durante la limpieza')
    } finally {
      setCleaning(false)
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredKeywords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredKeywords.map(k => k.id))
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`¿Descartar ${selectedIds.length} keywords?`)) return

    setActionLoading(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ status: 'discarded', cluster_id: null })
        .in('id', selectedIds)

      setSelectedIds([])
      await fetchData()
      alert('Keywords descartadas')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const removeFromCluster = async () => {
    if (selectedIds.length === 0) return

    setActionLoading(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: null, status: 'pending' })
        .in('id', selectedIds)

      setSelectedIds([])
      await fetchData()
      alert('Keywords quitadas del cluster')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const analyzeWithAI = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona keywords para analizar')
      return
    }

    const selectedKeywords = keywords
      .filter(k => selectedIds.includes(k.id))
      .map(k => k.keyword)

    if (selectedKeywords.length === 0) {
      alert('No se encontraron keywords válidas')
      return
    }

    setAnalyzingAI(true)
    try {
      console.log(`Starting AI analysis for ${selectedKeywords.length} keywords...`)
      const results = await analyzeKeywordsWithAI(selectedKeywords)
      
      if (!results.success) {
        alert(`Error: ${results.error || 'Error desconocido'}`)
        return
      }

      console.log('AI Analysis Results:', results)
      setAiResults(results)
      setShowPreview(true)
    } catch (err: any) {
      console.error('Error in AI analysis:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setAnalyzingAI(false)
    }
  }

  const applyAIChanges = async () => {
    if (!aiResults) return

    setApplyingChanges(true)
    try {
      let clustersCreated = 0
      let keywordsClustered = 0

      for (const cluster of aiResults.clusters) {
        const { data: clusterData, error: clusterError } = await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .insert({
            name: cluster.name,
            intent: cluster.intent,
            is_pillar: cluster.is_pillar,
            content_type: cluster.is_pillar ? 'landing' : 'blog'
          })
          .select()
          .single()

        if (clusterError) {
          console.error('Error creating cluster:', clusterError)
          continue
        }

        clustersCreated++

        const clusterKeywords = cluster.keywords
        const { data: keywordData } = await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('id')
          .in('keyword', clusterKeywords)

        if (keywordData && keywordData.length > 0) {
          const keywordIds = keywordData.map(k => k.id)
          
          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ 
              cluster_id: clusterData.id,
              status: 'clustered',
              intent: cluster.intent
            })
            .in('id', keywordIds)

          keywordsClustered += keywordIds.length
        }
      }

      let duplicatesRemoved = 0
      for (const dupGroup of aiResults.duplicates) {
        const keywordsToKeep = dupGroup.keywords.slice(0, 1)
        const keywordsToDiscard = dupGroup.keywords.slice(1)

        if (keywordsToDiscard.length > 0) {
          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ status: 'discarded', cluster_id: null })
            .in('keyword', keywordsToDiscard)
          
          duplicatesRemoved += keywordsToDiscard.length
        }
      }

      setShowPreview(false)
      setAiResults(null)
      setSelectedIds([])
      await fetchData()
      
      alert(`Cambios aplicados:\n• ${clustersCreated} clusters creados\n• ${keywordsClustered} keywords clusterizadas\n• ${duplicatesRemoved} duplicados descartados`)
    } catch (err: any) {
      console.error('Error applying changes:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setApplyingChanges(false)
    }
  }

  const cancelAIAnalysis = () => {
    setShowPreview(false)
    setAiResults(null)
  }

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = String(kw.keyword || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || kw.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const clusterMap = new Map((clusters || []).map(c => [c.id, c.name]))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Keywords</h2>
          <p className="text-gray-600">
            {totalCount} keywords | {(keywords || []).filter(k => !k.cluster_id).length} sin clasificar
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={cleanDatabase}
            disabled={cleaning}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Limpiar BBDD</span>
          </button>
          <Link href="/admin/keywords/import">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Importar CSV
            </button>
          </Link>
          <Link href="/admin/keywords/clusters">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Ver Clusters
            </button>
          </Link>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedIds.length} keywords seleccionadas
          </span>
          <div className="flex space-x-3">
            <button
              onClick={analyzeWithAI}
              disabled={analyzingAI}
              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {analyzingAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Analizar con IA</span>
            </button>
            <button
              onClick={removeFromCluster}
              disabled={actionLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              <XCircle className="w-4 h-4" />
              <span>Quitar del cluster</span>
            </button>
            <button
              onClick={deleteSelected}
              disabled={actionLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar keywords..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="clustered">Clusterizadas</option>
          <option value="discarded">Descartadas</option>
        </select>
      </div>

      {filteredKeywords.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-indigo-600 hover:text-indigo-800">
                      {selectedIds.length === filteredKeywords.length && filteredKeywords.length > 0 ? 
                        <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Volumen</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dificultad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => (
                  <tr key={keyword.id} className={`hover:bg-gray-50 ${keyword.status === 'discarded' ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(keyword.id)} className="text-indigo-600 hover:text-indigo-800">
                        {selectedIds.includes(keyword.id) ? 
                          <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {Number(keyword.search_volume || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {keyword.difficulty ? `${keyword.difficulty}/100` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        keyword.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        keyword.status === 'clustered' ? 'bg-green-100 text-green-800' :
                        keyword.status === 'discarded' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {keyword.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {keyword.cluster_id ? (
                        <Link href={`/admin/keywords/clusters/${keyword.cluster_id}`} className="text-indigo-600 hover:underline">
                          {clusterMap.get(keyword.cluster_id) || 'Cluster'}
                        </Link>
                      ) : (
                        <span className="text-yellow-600">Sin clasificar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay keywords</h3>
          <p className="text-gray-500 mb-4">Importa keywords desde un CSV para comenzar</p>
          <Link href="/admin/keywords/import">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Importar Keywords
            </button>
          </Link>
        </div>
      )}

      {showPreview && aiResults && (
        <AIPreviewModal
          results={aiResults}
          onApply={applyAIChanges}
          onCancel={cancelAIAnalysis}
          applying={applyingChanges}
        />
      )}
    </div>
  )
}

function AIPreviewModal({ 
  results, 
  onApply, 
  onCancel, 
  applying 
}: { 
  results: AIAnalysisResult
  onApply: () => void
  onCancel: () => void
  applying: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Análisis Semántico con IA</h3>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {results.totalAnalyzed} keywords analizadas • {results.clusters.length} clusters • {results.duplicates.length} duplicados • {results.canibalizations.length} canibalizaciones
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {results.duplicates.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Duplicados Semánticos ({results.duplicates.length})
              </h4>
              <div className="space-y-2">
                {results.duplicates.map((dup, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="font-medium text-red-800">{dup.keywords.join(', ')}</span>
                    <span className="text-red-600 text-sm ml-2">→ mantener uno, descartar {dup.keywords.length - 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.clusters.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Clusters Sugeridos ({results.clusters.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.clusters.map((cluster, i) => (
                  <div key={i} className={`border rounded-lg p-3 ${cluster.is_pillar ? 'bg-purple-50 border-purple-300' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{cluster.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${cluster.is_pillar ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'}`}>
                        {cluster.is_pillar ? 'PILLAR' : cluster.intent}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cluster.keywords.map((kw, j) => (
                        <span key={j} className="text-xs bg-white border px-2 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.canibalizations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Canibalizaciones Detectadas ({results.canibalizations.length})
              </h4>
              <div className="space-y-2">
                {results.canibalizations.map((can, i) => (
                  <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <span className="font-medium text-orange-800">{can.keywords.join(' ↔ ')}</span>
                    <span className="text-orange-600 text-sm ml-2">→ compiten por el mismo ranking</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.duplicates.length === 0 && results.clusters.length === 0 && results.canibalizations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron problemas o sugerencias.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={applying}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onApply}
            disabled={applying}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aplicando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Aplicar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
