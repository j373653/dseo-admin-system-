'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { detectSearchIntent, generateClusterName, getIntentBadge, SearchIntent, suggestUrlStructure } from '@/lib/search-intent'

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
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [unclusteredKeywords, setUnclusteredKeywords] = useState<Keyword[]>([])
  const [intentGroups, setIntentGroups] = useState<IntentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClusterName, setNewClusterName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [autoClustering, setAutoClustering] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState<SearchIntent | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch clusters
      const { data: clustersData, error: clustersError } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('*')
        .order('created_at', { ascending: false })

      if (clustersError) throw clustersError
      setClusters(clustersData || [])

      // Fetch unclustered keywords
      const { data: keywordsData, error: keywordsError } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, difficulty, cluster_id')
        .is('cluster_id', null)

      if (keywordsError) throw keywordsError
      const keywords = keywordsData || []
      setUnclusteredKeywords(keywords)

      // Agrupar por intención
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
      .filter(group => group.keywords.length >= 2)
      .sort((a, b) => b.keywords.length - a.keywords.length)
  }

  const createCluster = async (intent?: SearchIntent) => {
    const keywordsToCluster = intent 
      ? intentGroups.find(g => g.intent === intent)?.keywords || []
      : selectedKeywords.length > 0 
        ? unclusteredKeywords.filter(k => selectedKeywords.includes(k.id))
        : []

    if (keywordsToCluster.length === 0) return

    const name = newClusterName || (intent ? intentGroups.find(g => g.intent === intent)?.suggestedName : '')
    if (!name) return

    try {
      const { data, error } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .insert({
          name,
          description: `Cluster basado en intención: ${intent || 'manual'}`,
          keyword_count: keywordsToCluster.length,
          intent: intent || 'manual'
        })
        .select()
        .single()

      if (error) throw error

      // Assign keywords to new cluster
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: data.id, status: 'clustered' })
        .in('id', keywordsToCluster.map(k => k.id))

      setNewClusterName('')
      setSelectedKeywords([])
      setShowCreateModal(false)
      setSelectedIntent(null)
      fetchData()
    } catch (err) {
      console.error('Error creating cluster:', err)
      alert('Error al crear el cluster')
    }
  }

  const autoClusterByIntent = async () => {
    setAutoClustering(true)
    try {
      // Crear clusters por cada grupo de intención con 3+ keywords
      for (const group of intentGroups) {
        if (group.keywords.length >= 3) {
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
      alert(`Clustering completado: ${intentGroups.filter(g => g.keywords.length >= 3).length} clusters creados`)
    } catch (err) {
      console.error('Error auto-clustering:', err)
      alert('Error durante el clustering automático')
    } finally {
      setAutoClustering(false)
    }
  }

  const toggleKeywordSelection = (id: string) => {
    setSelectedKeywords(prev => 
      prev.includes(id) 
        ? prev.filter(k => k !== id)
        : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

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
          <button
            onClick={autoClusterByIntent}
            disabled={autoClustering || unclusteredKeywords.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {autoClustering ? 'Procesando...' : 'Auto-Cluster por Intención'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Crear Cluster Manual
          </button>
        </div>
      </div>

      {/* Intent Groups Preview */}
      {intentGroups.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Intención</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {intentGroups.map((group) => {
              const badge = getIntentBadge(group.intent)
              return (
                <div key={group.intent} className="bg-white rounded-lg shadow p-4 border-2 border-transparent hover:border-indigo-300 cursor-pointer transition-all"
                  onClick={() => setSelectedIntent(group.intent)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{group.keywords.length}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{group.suggestedName}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  {group.keywords.length >= 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        createCluster(group.intent)
                      }}
                      className="mt-3 w-full px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 transition-colors"
                    >
                      Crear Cluster
                    </button>
                  )}
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
              <div key={cluster.id} className="bg-white rounded-lg shadow p-6">
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

      {/* Unclustered Keywords */}
      {unclusteredKeywords.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Keywords sin clasificar ({unclusteredKeywords.length})
          </h3>
          
          {/* Filter by intent */}
          {selectedIntent && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-indigo-900">
                Mostrando keywords con intención: <strong>{getIntentBadge(selectedIntent).label}</strong>
              </span>
              <button 
                onClick={() => setSelectedIntent(null)}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Mostrar todas
              </button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Keyword</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Intención</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Volumen</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dificultad</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Seleccionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {unclusteredKeywords
                  .filter(kw => !selectedIntent || detectSearchIntent(kw.keyword).intent === selectedIntent)
                  .map((kw) => {
                    const intent = detectSearchIntent(kw.keyword)
                    const badge = getIntentBadge(intent.intent)
                    return (
                      <tr key={kw.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{kw.keyword}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{kw.search_volume || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{kw.difficulty || '-'}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedKeywords.includes(kw.id)}
                            onChange={() => toggleKeywordSelection(kw.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {selectedKeywords.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                {selectedKeywords.length} keywords seleccionadas
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Crear Cluster con Selección
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Cluster</h3>
            <input
              type="text"
              placeholder="Nombre del cluster"
              value={newClusterName}
              onChange={(e) => setNewClusterName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {selectedKeywords.length > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                Se asignarán {selectedKeywords.length} keywords a este cluster
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewClusterName('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => createCluster()}
                disabled={!newClusterName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
