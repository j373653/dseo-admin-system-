'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { detectSearchIntent, getIntentBadge, SearchIntent } from '@/lib/search-intent'
import { 
  Loader2, Trash2, ExternalLink, CheckCircle, XCircle, 
  AlertTriangle, Sparkles, RefreshCw, ArrowRight, HelpCircle,
  BarChart3, List, TrendingUp
} from 'lucide-react'

interface Cluster {
  id: string
  name: string
  description: string
  keyword_count: number
  search_volume_total: number
  intent: string
  is_pillar_page: boolean
  parent_cluster_id: string | null
  content_type_target: string | null
  priority_score: { final_priority: number } | null
  pillar_content_data: Record<string, unknown> | null
}

interface ClusterRelation {
  id: string
  source_cluster_id: string
  target_cluster_id: string
  similarity_score: number
  relation_type: string
}

const PROTECTED_URLS = [
  { url: '/', keywords: [] },
  { url: '/servicios/', keywords: ['servicios'] },
  { url: '/servicios/sitios-web/', keywords: ['sitios web', 'desarrollo web'] },
  { url: '/servicios/sitios-web/wordpress/', keywords: ['wordpress'] },
  { url: '/servicios/ecommerce/', keywords: ['tienda online', 'ecommerce'] },
  { url: '/servicios/ia/', keywords: ['inteligencia artificial', 'ia'] },
  { url: '/servicios/apps/', keywords: ['app', 'aplicación'] },
  { url: '/servicios/seo/', keywords: ['seo', 'posicionamiento'] },
  { url: '/servicios/seo/local/', keywords: ['seo local', 'google business'] },
  { url: '/servicios/seo/ecommerce/', keywords: ['seo tienda'] },
  { url: '/servicios/seo/tecnico/', keywords: ['seo técnico'] },
  { url: '/servicios/seo/keyword-research/', keywords: ['keyword'] },
  { url: '/servicios/sectores/', keywords: ['sector'] },
]

function matchClusterToSitemap(clusterName: string, intent?: string): { match: boolean; url?: string; action: 'update' | 'create' } {
  const nameLower = clusterName.toLowerCase()
  for (const page of PROTECTED_URLS) {
    for (const kw of page.keywords) {
      if (nameLower.includes(kw) || kw.includes(nameLower)) {
        return { match: true, url: page.url, action: 'update' }
      }
    }
  }
  
  const slug = nameLower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  if (intent === 'informational' || nameLower.includes('como') || nameLower.includes('guía') || nameLower.includes('qué es') || nameLower.includes('definición')) {
    return { match: false, url: `/blog/${slug}/`, action: 'create' }
  }
  
  return { match: false, url: `/servicios/${slug}/`, action: 'create' }
}

function suggestContentType(intent: string, clusterName: string): string {
  const nameLower = clusterName.toLowerCase()
  if (intent === 'transactional' || nameLower.includes('precio') || nameLower.includes('comprar')) return 'service'
  if (intent === 'informational' || nameLower.includes('como') || nameLower.includes('guía')) return 'blog'
  if (intent === 'commercial' || nameLower.includes('mejor') || nameLower.includes('compar')) return 'landing'
  return 'service'
}

export default function OverviewPage() {
  const router = useRouter()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [relations, setRelations] = useState<ClusterRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'volume' | 'name' | 'keywords'>('priority')
  const [calculating, setCalculating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [proposing, setProposing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clustersRes, relationsRes] = await Promise.all([
        supabaseClient.from('d_seo_admin_keyword_clusters').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('d_seo_admin_cluster_relations').select('*')
      ])
      setClusters(clustersRes.data || [])
      setRelations(relationsRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const recalculateVolumes = async () => {
    if (!confirm('¿Recalcular volúmenes de todos los clusters desde las keywords?')) return
    
    setCalculating(true)
    try {
      const { data: clusters } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('id')
      
      if (!clusters) return

      for (const cluster of clusters) {
        const { data: keywords } = await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('search_volume, difficulty')
          .eq('cluster_id', cluster.id)

        if (keywords && keywords.length > 0) {
          const totalVolume = keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0)
          const avgDifficulty = Math.round(keywords.reduce((sum, k) => sum + (k.difficulty || 0), 0) / keywords.length)
          
          await supabaseClient
            .from('d_seo_admin_keyword_clusters')
            .update({ 
              search_volume_total: totalVolume,
              difficulty_avg: avgDifficulty,
              keyword_count: keywords.length
            })
            .eq('id', cluster.id)
        }
      }

      await fetchData()
      alert('✅ Volúmenes recalculados correctamente')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCalculating(false)
    }
  }

  const calculatePriorities = async () => {
    setCalculating(true)
    try {
      for (const cluster of clusters) {
        const totalVolume = cluster.search_volume_total || 0
        const difficulty = cluster.priority_score ? 100 - (cluster.priority_score.final_priority * 0.5) : 50
        const keywordCount = cluster.keyword_count || 0
        
        const volumeScore = Math.min(100, totalVolume / 500)
        const difficultyScore = 100 - difficulty
        const businessValue = Math.min(100, keywordCount * 2 + volumeScore / 2)
        const finalPriority = Math.min(100, Math.round(
          volumeScore * 0.3 + difficultyScore * 0.2 + businessValue * 0.3 + keywordCount * 2
        ))

        await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .update({ priority_score: { final_priority: finalPriority, seo_score: volumeScore, business_value: businessValue, difficulty_score: difficultyScore } })
          .eq('id', cluster.id)
      }
      await fetchData()
      alert('✅ Prioridades calculadas')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCalculating(false)
    }
  }

  const analyzeWithAI = async () => {
    setAnalyzing(true)
    try {
      const { data: clusters } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('id, name')

      if (!clusters || clusters.length === 0) {
        alert('⚠️ No hay clusters creados. Crea clusters primero en la página Clusters.')
        setAnalyzing(false)
        return
      }

      const { data: keywordsToAnalyze } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, cluster_id')
        .in('status', ['pending', 'active'])
        .limit(1000)

      if (!keywordsToAnalyze || keywordsToAnalyze.length === 0) {
        alert('⚠️ No hay keywords para analizar.')
        setAnalyzing(false)
        return
      }

      const keywords = keywordsToAnalyze.filter(k => !k.cluster_id).map(k => k.keyword)
      const keywordIds = keywordsToAnalyze.filter(k => !k.cluster_id).map(k => k.id)

      if (keywords.length > 0) {
        alert(`📊 Generando embeddings para ${keywords.length} keywords...`)
        
        const response = await fetch('/api/ai/generate-embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords, keywordIds })
        })

        const result = await response.json()
        console.log('Embedding result:', result)
      }

      await fetch('/api/ai/generate-embeddings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      await fetchData()
      alert('✅ Análisis IA completado: embeddings, canibalizaciones y links internos generados')
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error durante el análisis. Revisa la consola.')
    } finally {
      setAnalyzing(false)
    }
  }

  const proposePillars = async () => {
    if (!confirm(`¿Proponer pilares automáticamente para ${orphanClusters.length} clusters huérfanos? Los clusters con mayor volumen se convertirán en pilares y los demás se enlazarán como hijos.`)) return
    
    setProposing(true)
    try {
      const orphans = [...clusters].filter(c => !c.is_pillar_page && !c.parent_cluster_id)
      orphans.sort((a, b) => (b.search_volume_total || 0) - (a.search_volume_total || 0))
      
      const pillarCount = Math.max(1, Math.min(20, Math.floor(orphans.length / 10)))
      const pillars = orphans.slice(0, pillarCount)
      const children = orphans.slice(pillarCount)
      
      for (const pillar of pillars) {
        await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .update({ is_pillar_page: true, content_type_target: suggestContentType(pillar.intent || '', pillar.name) })
          .eq('id', pillar.id)
      }
      
      for (const child of children) {
        const bestPillar = pillars.reduce((best, pillar) => {
          const bestSim = relations.find(r => 
            (r.source_cluster_id === pillar.id && r.target_cluster_id === child.id) ||
            (r.target_cluster_id === pillar.id && r.source_cluster_id === child.id)
          )
          const childSim = relations.find(r => 
            (r.source_cluster_id === best.id && r.target_cluster_id === child.id) ||
            (r.target_cluster_id === best.id && r.source_cluster_id === child.id)
          )
          return ((bestSim?.similarity_score || 0) > (childSim?.similarity_score || 0)) ? best : pillar
        }, pillars[0])
        
        await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .update({ 
            parent_cluster_id: bestPillar.id,
            content_type_target: suggestContentType(child.intent || '', child.name)
          })
          .eq('id', child.id)
      }
      
      await fetchData()
      alert(`✅ Propuesta de pilares completada: ${pillars.length} pilares, ${children.length} hijos`)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setProposing(false)
    }
  }

  const updateContentType = async (clusterId: string, contentType: string) => {
    await supabaseClient
      .from('d_seo_admin_keyword_clusters')
      .update({ content_type_target: contentType })
      .eq('id', clusterId)
    await fetchData()
  }

  const deleteCluster = async (clusterId: string) => {
    if (!confirm('¿Eliminar este cluster?')) return
    await supabaseClient.from('d_seo_admin_raw_keywords').update({ cluster_id: null, status: 'pending' }).eq('cluster_id', clusterId)
    await supabaseClient.from('d_seo_admin_keyword_clusters').delete().eq('id', clusterId)
    await fetchData()
  }

  const discardCluster = async (clusterId: string) => {
    if (!confirm('¿Descartar este cluster? Las keywords se marcarán como descartadas y se ignorarán en futuras importaciones.')) return
    await supabaseClient.from('d_seo_admin_raw_keywords').update({ cluster_id: null, status: 'discarded' }).eq('cluster_id', clusterId)
    await supabaseClient.from('d_seo_admin_keyword_clusters').delete().eq('id', clusterId)
    await fetchData()
  }

  const getClusterLinks = (clusterId: string): ClusterRelation[] => {
    return relations.filter(r => 
      (r.source_cluster_id === clusterId || r.target_cluster_id === clusterId) && 
      r.relation_type !== 'canibalization'
    )
  }

  const getLinkedCluster = (relation: ClusterRelation, clusterId: string): Cluster | undefined => {
    const otherId = relation.source_cluster_id === clusterId ? relation.target_cluster_id : relation.source_cluster_id
    return clusters.find(c => c.id === otherId)
  }

  const canibalizations = relations.filter(r => r.relation_type === 'canibalization')
  const orphanClusters = clusters.filter(c => !c.is_pillar_page && !c.parent_cluster_id)

  const filteredClusters = clusters
    .filter(c => {
      if (filter !== 'all' && c.intent !== filter) return false
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.priority_score?.final_priority || 0) - (a.priority_score?.final_priority || 0)
      if (sortBy === 'volume') return (b.search_volume_total || 0) - (a.search_volume_total || 0)
      if (sortBy === 'keywords') return (b.keyword_count || 0) - (a.keyword_count || 0)
      return a.name.localeCompare(b.name)
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Overview de Clusters</h2>
          <p className="text-gray-600">Gestiona tus clusters, prioridades y estrategia de contenido</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={calculatePriorities}
            disabled={calculating}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            title="Calcula score 0-100 basado en volumen, dificultad y valor de negocio"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>🔄 Recalcular</span>
          </button>
          <button
            onClick={recalculateVolumes}
            disabled={calculating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            title="Recalcula los volúmenes desde las keywords asignadas"
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Volúmenes</span>
          </button>
          <button
            onClick={analyzeWithAI}
            disabled={analyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            title="Genera embeddings para detectar canibalizaciones y sugerir links internos"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>🧠 Analizar IA</span>
          </button>
          <button
            onClick={proposePillars}
            disabled={proposing || orphanClusters.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            title="Propón pilares automáticamente para clusters huérfanos"
          >
            {proposing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>🎯 Proponer Pilares</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Clusters</p>
          <p className="text-2xl font-bold text-gray-900">{clusters.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Actualizar existente</p>
          <p className="text-2xl font-bold text-amber-600">{clusters.filter(c => matchClusterToSitemap(c.name, c.intent).action === 'update').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Crear nuevo</p>
          <p className="text-2xl font-bold text-green-600">{clusters.filter(c => matchClusterToSitemap(c.name, c.intent).action === 'create').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Canibalizaciones</p>
          <p className="text-2xl font-bold text-red-600">{canibalizations.length}</p>
        </div>
      </div>

      {/* Warnings */}
      {(canibalizations.length > 0 || orphanClusters.length > 0) && (
        <div className="space-y-2">
          {orphanClusters.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{orphanClusters.length} clusters sin pillar page asignada</p>
              </div>
            </div>
          )}
          {canibalizations.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">{canibalizations.length} posible(s) canibalización(es) detectada(s)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="🔍 Buscar cluster..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas las intenciones</option>
          <option value="transactional">Transactional</option>
          <option value="commercial">Commercial</option>
          <option value="informational">Informational</option>
          <option value="navigational">Navigational</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'priority' | 'volume' | 'name' | 'keywords')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="priority">Ordenar por prioridad</option>
          <option value="volume">Ordenar por volumen</option>
          <option value="keywords">Ordenar por keywords</option>
          <option value="name">Ordenar por nombre</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Volumen</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Intent</th>
                <th className="px-4 py-3 center text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links Sugeridos</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClusters.map(cluster => {
                const sitemapMatch = matchClusterToSitemap(cluster.name, cluster.intent)
                const links = getClusterLinks(cluster.id)
                const priority = cluster.priority_score?.final_priority || 0

                return (
                  <tr key={cluster.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {cluster.is_pillar_page && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">📄</span>
                        )}
                        <span className="font-medium text-gray-900">{cluster.name}</span>
                      </div>
                      {cluster.parent_cluster_id && (
                        <p className="text-xs text-gray-400">Hijo de cluster #{cluster.parent_cluster_id.slice(0,8)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {(cluster.search_volume_total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cluster.intent && (
                        <span className={`px-2 py-0.5 rounded text-xs ${getIntentBadge(cluster.intent as SearchIntent).color}`}>
                          {getIntentBadge(cluster.intent as SearchIntent).label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        sitemapMatch.action === 'update' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {sitemapMatch.action === 'update' ? '🔄' : '🆕'} {sitemapMatch.action === 'update' ? 'Update' : 'New'}
                      </span>
                      {sitemapMatch.url && (
                        <p className="text-xs text-gray-400 mt-1">{sitemapMatch.url}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={cluster.content_type_target || suggestContentType(cluster.intent || '', cluster.name)}
                        onChange={(e) => updateContentType(cluster.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="service">Service</option>
                        <option value="blog">Blog</option>
                        <option value="landing">Landing</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        priority >= 75 ? 'bg-green-100 text-green-700' :
                        priority >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {links.length > 0 ? (
                        <div className="space-y-1">
                          {links.slice(0, 2).map(link => {
                            const linked = getLinkedCluster(link, cluster.id)
                            if (!linked) return null
                            return (
                              <div key={link.id} className="text-xs flex items-center text-gray-600">
                                <ArrowRight className="w-3 h-3 mx-1" />
                                {linked.name} ({(link.similarity_score * 100).toFixed(0)}%)
                              </div>
                            )
                          })}
                          {links.length > 2 && (
                            <p className="text-xs text-gray-400">+{links.length - 2} más</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => router.push(`/admin/keywords/clusters/${cluster.id}`)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Ver detalle"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => discardCluster(cluster.id)}
                          className="p-1 text-gray-400 hover:text-amber-600"
                          title="Descartar (keywords ignoradas en futuras importaciones)"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCluster(cluster.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredClusters.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay clusters disponibles
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex space-x-4 text-sm">
        <button
          onClick={() => router.push('/admin/keywords/clusters')}
          className="flex items-center space-x-1 text-indigo-600 hover:underline"
        >
          <List className="w-4 h-4" />
          <span>Ver lista técnica</span>
        </button>
      </div>
    </div>
  )
}
