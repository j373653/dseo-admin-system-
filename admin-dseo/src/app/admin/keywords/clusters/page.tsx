'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { detectSearchIntent, generateClusterName, getIntentBadge, SearchIntent } from '@/lib/search-intent'
import IntentAnalysisModal, { UnknownKeywordsSection } from '@/components/IntentAnalysisModal'
import { Loader2, AlertTriangle, Plus, Trash2, Edit2, BarChart3, Lightbulb, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { AIKeywordAnalysis } from '@/lib/ai-analysis'

interface Cluster {
  id: string
  name: string
  description: string
  keyword_count: number
  search_volume_total: number
  intent: string
  created_at: string
  is_pillar_page: boolean
  parent_cluster_id: string | null
  content_type_target: string | null
  priority_score: { final_priority: number } | null
  pillar_content_data: Record<string, unknown> | null
}

interface Keyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number
  cluster_id: string | null
}

interface IntentGroup {
  intent: SearchIntent;
  keywords: Keyword[];
  suggestedName: string;
}

// URLs del sitemap (protegidas - no modificar)
const PROTECTED_URLS = [
  { url: '/', name: 'Home', keywords: [] },
  { url: '/servicios/', name: 'Servicios', keywords: ['servicios'] },
  { url: '/servicios/sitios-web/', name: 'Sitios Web', keywords: ['sitios web', 'desarrollo web', 'crear web'] },
  { url: '/servicios/sitios-web/wordpress/', name: 'WordPress', keywords: ['wordpress', 'wp', 'gestor contenidos'] },
  { url: '/servicios/sitios-web/legal/', name: 'Web Legal', keywords: ['legal', 'aviso legal', 'privacidad'] },
  { url: '/servicios/ecommerce/', name: 'E-commerce', keywords: ['tienda online', 'ecommerce', 'comercio electrónico'] },
  { url: '/servicios/ia/', name: 'IA', keywords: ['inteligencia artificial', 'ia', 'ai', 'chatbot'] },
  { url: '/servicios/apps/', name: 'Apps', keywords: ['app', 'aplicación', 'móvil'] },
  { url: '/servicios/seo/', name: 'SEO', keywords: ['seo', 'posicionamiento', 'google'] },
  { url: '/servicios/seo/local/', name: 'SEO Local', keywords: ['seo local', 'google business', 'maps'] },
  { url: '/servicios/seo/ecommerce/', name: 'SEO Ecommerce', keywords: ['seo tienda', 'productos'] },
  { url: '/servicios/seo/tecnico/', name: 'SEO Técnico', keywords: ['seo técnico', 'velocidad', 'core web'] },
  { url: '/servicios/seo/keyword-research/', name: 'Keyword Research', keywords: ['keyword', 'palabras clave'] },
  { url: '/servicios/sectores/', name: 'Sectores', keywords: ['sector', 'nichos'] },
]

// Función para detectar si un cluster coincide con una URL del sitemap
function matchClusterToSitemap(clusterName: string, intent: string): { match: boolean; url?: string; action: 'update' | 'create' } {
  const nameLower = clusterName.toLowerCase()
  
  for (const page of PROTECTED_URLS) {
    for (const kw of page.keywords) {
      if (nameLower.includes(kw) || kw.includes(nameLower)) {
        return { match: true, url: page.url, action: 'update' }
      }
    }
  }
  
  return { match: false, action: 'create' }
}

// Función para sugerir tipo de contenido
function suggestContentType(intent: string, clusterName: string): string {
  const nameLower = clusterName.toLowerCase()
  
  if (intent === 'transactional' || nameLower.includes('precio') || nameLower.includes('comprar')) {
    return 'service'
  }
  if (intent === 'informational' || nameLower.includes('como') || nameLower.includes('guía')) {
    return 'blog'
  }
  if (intent === 'commercial' || nameLower.includes('mejor') || nameLower.includes('compar')) {
    return 'landing'
  }
  
  return 'service'
}

export default function ClustersPage() {
  const router = useRouter()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [unclusteredKeywords, setUnclusteredKeywords] = useState<Keyword[]>([])
  const [intentGroups, setIntentGroups] = useState<IntentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClusterName, setNewClusterName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [autoClustering, setAutoClustering] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState<SearchIntent | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisIntent, setAnalysisIntent] = useState<SearchIntent>('unknown')
  const [deletingClusters, setDeletingClusters] = useState(false)
  const [creatingCluster, setCreatingCluster] = useState<string | null>(null)
  
  // Parent cluster modal
  const [showParentModal, setShowParentModal] = useState(false)
  const [selectedClusterForParent, setSelectedClusterForParent] = useState<string>('')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [updatingParent, setUpdatingParent] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: clustersData } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('*')
        .order('created_at', { ascending: false })

      setClusters(clustersData || [])

      const { data: keywordsData } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, difficulty, cluster_id')
        .is('cluster_id', null)

      const keywords = keywordsData || []
      setUnclusteredKeywords(keywords)

      const groups = analyzeIntents(keywords)
      setIntentGroups(groups)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const analyzeIntents = (keywords: Keyword[]): IntentGroup[] => {
    const groups: { [key in SearchIntent]?: Keyword[] } = {}

    keywords.forEach(kw => {
      const { intent } = detectSearchIntent(kw.keyword)
      if (!groups[intent]) {
        groups[intent] = []
      }
      groups[intent]!.push(kw)
    })

    return (Object.entries(groups) as [SearchIntent, Keyword[]][])
      .map(([intent, keywords]) => ({
        intent,
        keywords,
        suggestedName: generateClusterName(keywords.map(k => k.keyword))
      }))
      .filter(group => group.keywords.length >= 1)
      .sort((a, b) => b.keywords.length - a.keywords.length)
  }

  interface ClusterWithLevel extends Cluster {
    level: number
    parentName: string | null
  }

  const buildHierarchy = (): ClusterWithLevel[] => {
    const clusterMap = new Map<string, Cluster>()
    clusters.forEach(c => clusterMap.set(c.id, c))

    const result: ClusterWithLevel[] = []
    
    // First, find root clusters (no parent or parent not in list)
    const rootClusters = clusters.filter(c => {
      if (!c.parent_cluster_id) return true
      return !clusterMap.has(c.parent_cluster_id)
    })

    // Build hierarchy recursively
    const addChildren = (parentId: string | null, level: number) => {
      const children = clusters.filter(c => c.parent_cluster_id === parentId)
      children.forEach(child => {
        const parentName = parentId ? clusterMap.get(parentId)?.name || null : null
        result.push({ ...child, level, parentName })
        addChildren(child.id, level + 1)
      })
    }

    rootClusters.forEach(cluster => {
      result.push({ ...cluster, level: 0, parentName: null })
      addChildren(cluster.id, 1)
    })

    // Add orphans (clusters with parent not in database)
    const addedIds = new Set(result.map(c => c.id))
    clusters.forEach(cluster => {
      if (!addedIds.has(cluster.id) && cluster.parent_cluster_id && !clusterMap.has(cluster.parent_cluster_id)) {
        result.push({ ...cluster, level: 0, parentName: '（外部）' })
      }
    })

    return result
  }

  const getOrphanClusters = (): Cluster[] => {
    const pillarIds = new Set(clusters.filter(c => c.is_pillar_page).map(c => c.id))
    return clusters.filter(c => !c.parent_cluster_id && !c.is_pillar_page && !pillarIds.has(c.id))
  }

  const isDescendantOf = (clusterId: string, potentialParentId: string): boolean => {
    const cluster = clusters.find(c => c.id === clusterId)
    if (!cluster || !cluster.parent_cluster_id) return false
    if (cluster.parent_cluster_id === potentialParentId) return true
    return isDescendantOf(cluster.parent_cluster_id, potentialParentId)
  }

  const deleteSingleCluster = async (clusterId: string) => {
    if (!confirm('¿Eliminar este cluster? Las keywords volverán a estado sin clasificar.')) return
    
    try {
      // Desasignar keywords
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: null, status: 'pending' })
        .eq('cluster_id', clusterId)
      
      // Eliminar cluster
      await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .delete()
        .eq('id', clusterId)
      
      await fetchData()
    } catch (err) {
      console.error('Error deleting cluster:', err)
      alert('Error al eliminar el cluster')
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
      console.error('Error updating content type:', err)
    }
  }

  const deleteAllClusters = async () => {
    if (!confirm('¿Estás seguro de eliminar TODOS los clusters existentes? Las keywords volverán a estado sin clasificar.')) {
      return
    }

    setDeletingClusters(true)
    try {
      // Desasignar keywords de clusters
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: null, status: 'pending' })
        .not('cluster_id', 'is', null)

      // Eliminar clusters
      await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      fetchData()
      alert('Todos los clusters han sido eliminados')
    } catch (err) {
      console.error('Error deleting clusters:', err)
      alert('Error al eliminar clusters')
    } finally {
      setDeletingClusters(false)
    }
  }

  const openParentModal = (clusterId: string, currentParentId: string | null) => {
    setSelectedClusterForParent(clusterId)
    setSelectedParentId(currentParentId || '')
    setShowParentModal(true)
  }

  const updateParentCluster = async () => {
    if (!selectedClusterForParent) return
    
    setUpdatingParent(true)
    try {
      await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .update({ parent_cluster_id: selectedParentId || null })
        .eq('id', selectedClusterForParent)
      
      setShowParentModal(false)
      await fetchData()
    } catch (err) {
      console.error('Error updating parent:', err)
      alert('Error al actualizar el cluster padre')
    } finally {
      setUpdatingParent(false)
    }
  }

  const openAnalysis = (intent: SearchIntent) => {
    const group = intentGroups.find(g => g.intent === intent)
    if (group) {
      setAnalysisIntent(intent)
      setShowAnalysisModal(true)
    }
  }

  const getKeywordsForAnalysis = () => {
    const group = intentGroups.find(g => g.intent === analysisIntent)
    return group?.keywords || []
  }

  const handleApplyAIAnalysis = async (analyses: AIKeywordAnalysis[]) => {
    try {
      // Agrupar análisis por cluster
      const clusterGroups: { [key: string]: AIKeywordAnalysis[] } = {}
      analyses.forEach(analysis => {
        const clusterName = analysis.cluster
        if (!clusterGroups[clusterName]) {
          clusterGroups[clusterName] = []
        }
        clusterGroups[clusterName].push(analysis)
      })

      let createdClusters = 0
      let assignedKeywords = 0

      // Crear clusters y asignar keywords
      for (const [clusterName, clusterAnalyses] of Object.entries(clusterGroups)) {
        const firstAnalysis = clusterAnalyses[0]
        
        // Crear cluster
        const { data: cluster } = await supabaseClient
          .from('d_seo_admin_keyword_clusters')
          .insert({
            name: clusterName.replace(/_/g, ' '),
            description: `Cluster generado por IA - Intención: ${firstAnalysis.intent} (${clusterAnalyses.length} keywords)`,
            keyword_count: clusterAnalyses.length,
            intent: firstAnalysis.intent
          })
          .select()
          .single()

        if (cluster) {
          createdClusters++
          
          // Obtener IDs de keywords
          const keywordTexts = clusterAnalyses.map(a => a.keyword)
          const { data: keywordsData } = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .select('id, keyword')
            .in('keyword', keywordTexts)

          if (keywordsData) {
            const keywordIds = keywordsData.map(k => k.id)
            
            // Actualizar keywords
            const { error } = await supabaseClient
              .from('d_seo_admin_raw_keywords')
              .update({ 
                cluster_id: cluster.id, 
                status: 'clustered',
                intent: firstAnalysis.intent
              })
              .in('id', keywordIds)

            if (!error) {
              assignedKeywords += keywordIds.length
            }
          }
        }
      }

      // Cerrar modal PRIMERO para mejor UX
      setShowAnalysisModal(false)
      
      // Refrescar datos
      await fetchData()
      
      // Mostrar confirmación
      alert(`✅ Análisis completado:\n• ${createdClusters} clusters creados\n• ${assignedKeywords} keywords asignadas`)
    } catch (err) {
      console.error('Error applying AI analysis:', err)
      alert('❌ Error al aplicar el análisis de IA')
      throw err // Re-lanzar para que el modal maneje el error
    }
  }

  const createCluster = async (intent?: SearchIntent) => {
    if (creatingCluster) return // Prevenir duplicados por clics múltiples
    
    const keywordsToCluster = intent 
      ? intentGroups.find(g => g.intent === intent)?.keywords || []
      : selectedKeywords.length > 0 
        ? unclusteredKeywords.filter(k => selectedKeywords.includes(k.id))
        : []

    if (keywordsToCluster.length === 0) return

    const name = newClusterName || (intent ? intentGroups.find(g => g.intent === intent)?.suggestedName : '')
    if (!name) return

    setCreatingCluster(intent || 'manual')

    try {
      const { data } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .insert({
          name,
          description: `Cluster basado en intención: ${intent || 'manual'}`,
          keyword_count: keywordsToCluster.length,
          intent: intent || 'manual'
        })
        .select()
        .single()

      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: data.id, status: 'clustered' })
        .in('id', keywordsToCluster.map(k => k.id))

      setNewClusterName('')
      setSelectedKeywords([])
      setShowCreateModal(false)
      setSelectedIntent(null)
      await fetchData()
    } catch (err) {
      console.error('Error creating cluster:', err)
      alert('Error al crear el cluster')
    } finally {
      setCreatingCluster(null)
    }
  }

  const autoClusterByIntent = async () => {
    setAutoClustering(true)
    try {
      for (const group of intentGroups) {
        if (group.keywords.length >= 3 && group.intent !== 'unknown') {
          const { data: cluster } = await supabaseClient
            .from('d_seo_admin_keyword_clusters')
            .insert({
              name: group.suggestedName,
              description: `Cluster automático - Intención: ${group.intent} (${group.keywords.length} keywords)`,
              keyword_count: group.keywords.length,
              intent: group.intent
            })
            .select()
            .single()

          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ cluster_id: cluster.id, status: 'clustered' })
            .in('id', group.keywords.map(k => k.id))
        }
      }

      fetchData()
      const createdCount = intentGroups.filter(g => g.keywords.length >= 3 && g.intent !== 'unknown').length
      alert(`Clustering completado: ${createdCount} clusters creados`)
    } catch (err) {
      console.error('Error auto-clustering:', err)
      alert('Error durante el clustering automático')
    } finally {
      setAutoClustering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const unknownGroup = intentGroups.find(g => g.intent === 'unknown')

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clusters de Keywords</h2>
          <p className="text-gray-600">
            {clusters.length} clusters | {unclusteredKeywords.length} keywords sin clasificar
          </p>
        </div>
        <div className="flex space-x-3">
          {clusters.length > 0 && (
            <button
              onClick={deleteAllClusters}
              disabled={deletingClusters}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deletingClusters ? 'Eliminando...' : 'Eliminar Todos'}
            </button>
          )}
        </div>
      </div>

      {/* Unknown Keywords Alert */}
      {unknownGroup && unknownGroup.keywords.length > 0 && (
        <UnknownKeywordsSection 
          keywords={unknownGroup.keywords}
          onAnalyzeWithAI={(keywords) => {
            setAnalysisIntent('unknown')
            setShowAnalysisModal(true)
          }}
        />
      )}

      {/* Intent Groups Preview */}
      {intentGroups.filter(g => g.intent !== 'unknown').length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Intención</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {intentGroups
              .filter(g => g.intent !== 'unknown')
              .map((group) => {
                const badge = getIntentBadge(group.intent)
                return (
                  <div key={group.intent} 
                    className="bg-white rounded-lg shadow p-4 border-2 border-transparent hover:border-indigo-300 cursor-pointer transition-all"
                    onClick={() => openAnalysis(group.intent)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">{group.keywords.length}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{group.suggestedName}</p>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openAnalysis(group.intent)
                        }}
                        className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Ver análisis
                      </button>
                      {group.keywords.length >= 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            createCluster(group.intent)
                          }}
                          disabled={creatingCluster === group.intent}
                          className="flex-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {creatingCluster === group.intent ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creando...
                            </>
                          ) : (
                            'Crear'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Orphan Clusters Warning */}
      {getOrphanClusters().length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Clusters sin Pillar Page</h3>
              <p className="text-sm text-yellow-600 mt-1">
                {getOrphanClusters().length} clusters no tienen una Pillar Page asignada. 
                Considera asignarles un cluster padre o marcar uno como Pillar Page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing Clusters - Improved UI */}
      {clusters.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Clusters Existentes</h3>
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push('/admin/keywords/strategy')}
                className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Estrategia</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">Cluster</div>
              <div className="col-span-1 text-center">Keywords</div>
              <div className="col-span-1 text-center">Volumen</div>
              <div className="col-span-1 text-center">Intención</div>
              <div className="col-span-1 text-center">Acción</div>
              <div className="col-span-1 text-center">Tipo</div>
              <div className="col-span-1 text-center">Prioridad</div>
              <div className="col-span-3 text-right">Acciones</div>
            </div>

            {/* Clusters List */}
            <div className="divide-y divide-gray-100">
              {buildHierarchy().map((cluster) => {
                const sitemapMatch = matchClusterToSitemap(cluster.name, cluster.intent || '')
                const suggestedType = cluster.content_type_target || suggestContentType(cluster.intent || '', cluster.name)
                const priority = cluster.priority_score?.final_priority || 0
                
                return (
                  <div 
                    key={cluster.id} 
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${
                      cluster.is_pillar_page ? 'bg-purple-50/50' : ''
                    }`}
                    style={{ marginLeft: `${cluster.level * 24}px` }}
                  >
                    {/* Cluster Name */}
                    <div className="col-span-3 flex items-center space-x-2">
                      {cluster.is_pillar_page && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                          📄
                        </span>
                      )}
                      {cluster.level > 0 && (
                        <span className="text-xs text-gray-400">↳</span>
                      )}
                      <div>
                        <span 
                          className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
                          onClick={() => router.push(`/admin/keywords/clusters/${cluster.id}`)}
                        >
                          {cluster.name}
                        </span>
                        {cluster.parentName && (
                          <p className="text-xs text-gray-400">Padre: {cluster.parentName}</p>
                        )}
                      </div>
                    </div>

                    {/* Keywords Count */}
                    <div className="col-span-1 text-center text-sm text-gray-600">
                      {cluster.keyword_count}
                    </div>

                    {/* Volume */}
                    <div className="col-span-1 text-center text-sm font-medium text-gray-900">
                      {cluster.search_volume_total?.toLocaleString() || 0}
                    </div>

                    {/* Intent */}
                    <div className="col-span-1 text-center">
                      {cluster.intent && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getIntentBadge(cluster.intent as SearchIntent).color}`}>
                          {getIntentBadge(cluster.intent as SearchIntent).label}
                        </span>
                      )}
                    </div>

                    {/* Action (Update/Create) */}
                    <div className="col-span-1 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        sitemapMatch.action === 'update' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sitemapMatch.action === 'update' ? '🔄' : '🆕'} {sitemapMatch.action === 'update' ? 'Update' : 'Create'}
                      </span>
                      {sitemapMatch.url && (
                        <p className="text-xs text-gray-400 mt-0.5">{sitemapMatch.url}</p>
                      )}
                    </div>

                    {/* Content Type */}
                    <div className="col-span-1 text-center">
                      <select
                        value={suggestedType}
                        className="text-xs border rounded px-1 py-0.5 bg-white"
                        onChange={(e) => updateContentType(cluster.id, e.target.value)}
                      >
                        <option value="service">Service</option>
                        <option value="blog">Blog</option>
                        <option value="landing">Landing</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="col-span-1 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        priority >= 75 ? 'bg-green-100 text-green-700' :
                        priority >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {priority}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex justify-end space-x-1">
                      <button
                        onClick={() => router.push(`/admin/keywords/clusters/${cluster.id}`)}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="Ver detalle"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openParentModal(cluster.id, cluster.parent_cluster_id)
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="Asignar padre"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push('/admin/keywords/strategy')
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="Ver estrategia"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSingleCluster(cluster.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      <IntentAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        intent={analysisIntent}
        keywords={getKeywordsForAnalysis()}
        onApplyAIAnalysis={handleApplyAIAnalysis}
      />

      {/* Parent Cluster Modal */}
      {showParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Asignar Cluster Padre
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedParentId === '' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="parentCluster"
                  value=""
                  checked={selectedParentId === ''}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="sr-only"
                />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  Sin cluster padre (raíz)
                </span>
              </label>
              
              {clusters
                .filter(c => c.id !== selectedClusterForParent)
                .filter(c => !isDescendantOf(c.id, selectedClusterForParent))
                .map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedParentId === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="parentCluster"
                    value={c.id}
                    checked={selectedParentId === c.id}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    {c.is_pillar_page && (
                      <span className="ml-2 px-1 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Pillar</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowParentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={updateParentCluster}
                disabled={updatingParent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {updatingParent && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
