'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { detectSearchIntent, generateClusterName, getIntentBadge, SearchIntent } from '@/lib/search-intent'
import IntentAnalysisModal, { UnknownKeywordsSection } from '@/components/IntentAnalysisModal'
import { AIKeywordAnalysis } from '@/lib/ai-analysis'

interface Cluster {
  id: string
  name: string
  description: string
  keyword_count: number
  search_volume_total: number
  intent: string
  created_at: string
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
          <button
            onClick={autoClusterByIntent}
            disabled={autoClustering || unclusteredKeywords.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {autoClustering ? 'Procesando...' : 'Auto-Cluster por Intención'}
          </button>
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

      {/* Existing Clusters */}
      {clusters.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clusters Existentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clusters.map((cluster) => (
              <div 
                key={cluster.id} 
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-indigo-300"
                onClick={() => router.push(`/admin/keywords/clusters/${cluster.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{cluster.name}</h4>
                  {cluster.intent && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntentBadge(cluster.intent as SearchIntent).color}`}>
                      {getIntentBadge(cluster.intent as SearchIntent).label}
                    </span>
                  )}
                </div>
                {cluster.description && (
                  <p className="text-sm text-gray-600 mb-4">{cluster.description}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{cluster.keyword_count} keywords</span>
                  <span>{cluster.search_volume_total?.toLocaleString() || 0} vol. total</span>
                </div>
              </div>
            ))}
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
    </div>
  )
}
