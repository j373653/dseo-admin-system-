'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { ArrowRight, AlertTriangle, CheckCircle, BarChart3, Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface ClusterStrategy {
  id: string
  name: string
  intent: string
  keyword_count: number
  search_volume_total: number
  difficulty_avg: number
  is_pillar_page: boolean
  content_type_target: string
  priority_score: {
    seo_score: number
    business_value: number
    difficulty_score: number
    final_priority: number
  }
  recommendations: Array<{ type: string; message: string; action?: string }>
}

interface ClusterRelation {
  id: string
  source_cluster_id: string
  target_cluster_id: string
  similarity_score: number
  relation_type: string
}

export default function StrategyPage() {
  const [clusters, setClusters] = useState<ClusterStrategy[]>([])
  const [relations, setRelations] = useState<ClusterRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [clustersRes, relationsRes] = await Promise.all([
        supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseClient
          .from('d_seo_admin_cluster_relations')
          .select('*')
      ])

      const clustersData = (clustersRes.data || []).map(c => ({
        ...c,
        priority_score: typeof c.priority_score === 'string' 
          ? JSON.parse(c.priority_score) 
          : c.priority_score || { seo_score: 0, business_value: 0, difficulty_score: 0, final_priority: 0 },
        recommendations: typeof c.recommendations === 'string'
          ? JSON.parse(c.recommendations)
          : c.recommendations || []
      }))

      setClusters(clustersData)
      setRelations(relationsRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateEmbeddings = async () => {
    setGeneratingEmbeddings(true)
    try {
      const keywordsRes = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, embedding')
        .is('embedding', null)
        .limit(500)

      if (keywordsRes.data && keywordsRes.data.length > 0) {
        const keywords = keywordsRes.data.map(k => k.keyword)
        const keywordIds = keywordsRes.data.map(k => k.id)

        await fetch('/api/ai/generate-embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords, keywordIds })
        })
      }

      await fetch('/api/ai/generate-embeddings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      await fetchData()
      alert('✅ Embeddings y relaciones generados correctamente')
    } catch (err) {
      console.error('Error:', err)
      alert('Error al generar embeddings')
    } finally {
      setGeneratingEmbeddings(false)
    }
  }

  const calculatePriorityScores = async () => {
    try {
      for (const cluster of clusters) {
        const totalVolume = cluster.search_volume_total || 0
        const avgDifficulty = cluster.difficulty_avg || 50
        const keywordCount = cluster.keyword_count || 0

        const volumeScore = Math.min(100, totalVolume / 500)
        const difficultyScore = 100 - avgDifficulty
        const businessValue = Math.min(100, keywordCount * 2 + volumeScore / 2)
        const finalPriority = Math.min(100, 
          volumeScore * 0.3 + difficultyScore * 0.2 + businessValue * 0.3 + keywordCount * 2
        )

        await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .update({
            priority_score: {
              seo_score: Math.round(volumeScore),
              difficulty_score: Math.round(difficultyScore),
              business_value: Math.round(businessValue),
              final_priority: Math.round(finalPriority)
            }
          })
          .eq('id', cluster.id)
      }

      await fetchData()
      alert('✅ Priority scores calculados')
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const updateContentType = async (clusterId: string, contentType: string) => {
    try {
      await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .update({ content_type_target: contentType })
        .eq('id', clusterId)

      await fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getFilteredClusters = () => {
    if (filter === 'all') return clusters
    return clusters.filter(c => c.content_type_target === filter)
  }

  const canibalizations = relations.filter(r => r.relation_type === 'canibalization')
  const relatedLinks = relations.filter(r => r.relation_type === 'internal_link')

  const getPriorityColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-800'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'service':
        return 'bg-blue-100 text-blue-800'
      case 'blog':
        return 'bg-purple-100 text-purple-800'
      case 'landing':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estrategia de Contenido</h2>
          <p className="text-gray-600">
            Análisis de clusters, priorización y recomendaciones de contenido
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={calculatePriorityScores}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Calcular Prioridades</span>
          </button>
          <button
            onClick={generateEmbeddings}
            disabled={generatingEmbeddings}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {generatingEmbeddings ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{generatingEmbeddings ? 'Generando...' : 'Generar Embeddings'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Clusters</p>
          <p className="text-2xl font-bold text-gray-900">{clusters.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Servicios</p>
          <p className="text-2xl font-bold text-blue-600">{clusters.filter(c => c.content_type_target === 'service').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Blog</p>
          <p className="text-2xl font-bold text-purple-600">{clusters.filter(c => c.content_type_target === 'blog').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Canibalizaciones</p>
          <p className="text-2xl font-bold text-red-600">{canibalizations.length}</p>
        </div>
      </div>

      {/* Canibalizations Warning */}
      {canibalizations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Canibalizaciones Detectadas</h3>
              <p className="text-sm text-red-600 mt-1">
                {canibalizations.length} clusters tienen contenido muy similar. 
                Considera unirlos o diferenciarlos claramente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {['all', 'service', 'blog', 'landing'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Clusters Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volumen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredClusters().map(cluster => (
              <tr key={cluster.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{cluster.name}</span>
                    {cluster.is_pillar_page && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">📄 Pillar</span>
                    )}
                  </div>
                  {cluster.intent && (
                    <span className="text-xs text-gray-500">{cluster.intent}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={cluster.content_type_target || 'unknown'}
                    onChange={(e) => updateContentType(cluster.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${getContentTypeBadge(cluster.content_type_target || 'unknown')}`}
                  >
                    <option value="unknown">Sin asignar</option>
                    <option value="service">Servicio</option>
                    <option value="blog">Blog</option>
                    <option value="landing">Landing</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {cluster.keyword_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {cluster.search_volume_total?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(cluster.priority_score?.final_priority || 0)}`}>
                    {cluster.priority_score?.final_priority || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => window.open(`/admin/keywords/clusters/${cluster.id}`, '_blank')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center space-x-1"
                  >
                    <span>Ver detalle</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {getFilteredClusters().length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay clusters disponibles
          </div>
        )}
      </div>

      {/* Internal Links Suggestions */}
      {relatedLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Sugerencias de Links Internos
          </h3>
          <div className="space-y-2">
            {relatedLinks.slice(0, 10).map(rel => {
              const source = clusters.find(c => c.id === rel.source_cluster_id)
              const target = clusters.find(c => c.id === rel.target_cluster_id)
              if (!source || !target) return null
              
              return (
                <div key={rel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{source.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                  <span className="text-sm text-gray-900">{target.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({(rel.similarity_score * 100).toFixed(0)}% similar)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
