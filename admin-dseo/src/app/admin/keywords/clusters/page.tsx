'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Cluster {
  id: string
  name: string
  description: string
  keyword_count: number
  search_volume_total: number
  created_at: string
}

interface Keyword {
  id: string
  keyword: string
  cluster_id: string | null
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [unclusteredKeywords, setUnclusteredKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClusterName, setNewClusterName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [autoClustering, setAutoClustering] = useState(false)

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

      // Fetch unclustered keywords (all of them)
      const { data: keywordsData, error: keywordsError } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, cluster_id')
        .is('cluster_id', null)

      if (keywordsError) throw keywordsError
      setUnclusteredKeywords(keywordsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createCluster = async () => {
    if (!newClusterName.trim()) return

    try {
      const { data, error } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .insert({
          name: newClusterName,
          description: '',
          keyword_count: selectedKeywords.length
        })
        .select()
        .single()

      if (error) throw error

      // Assign selected keywords to new cluster
      if (selectedKeywords.length > 0) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ cluster_id: data.id, status: 'clustered' })
          .in('id', selectedKeywords)
      }

      setNewClusterName('')
      setSelectedKeywords([])
      setShowCreateModal(false)
      fetchData()
    } catch (err) {
      console.error('Error creating cluster:', err)
      alert('Error al crear el cluster')
    }
  }

  const autoCluster = async () => {
    setAutoClustering(true)
    try {
      // Simple auto-clustering based on common words
      const keywords = unclusteredKeywords.map(k => ({ id: k.id, keyword: k.keyword.toLowerCase() }))
      
      // Group by first word
      const groups: { [key: string]: string[] } = {}
      keywords.forEach(kw => {
        const firstWord = kw.keyword.split(' ')[0]
        if (!groups[firstWord]) groups[firstWord] = []
        groups[firstWord].push(kw.id)
      })

      // Create clusters for groups with 3+ keywords
      for (const [word, ids] of Object.entries(groups)) {
        if (ids.length >= 3) {
          const { data: cluster } = await supabaseClient
            .from('d_seo_admin_keyword_clusters')
            .insert({
              name: word.charAt(0).toUpperCase() + word.slice(1),
              description: `Cluster automático para "${word}"`,
              keyword_count: ids.length
            })
            .select()
            .single()

          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ cluster_id: cluster.id, status: 'clustered' })
            .in('id', ids)
        }
      }

      fetchData()
      alert('Clustering automático completado')
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
            onClick={autoCluster}
            disabled={autoClustering || unclusteredKeywords.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {autoClustering ? 'Procesando...' : 'Auto-Cluster'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Crear Cluster Manual
          </button>
        </div>
      </div>

      {/* Clusters Grid */}
      {clusters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{cluster.name}</h3>
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
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center mb-8">
          <p className="text-gray-500">No hay clusters creados todavía</p>
          <p className="text-sm text-gray-400 mt-2">
            Usa "Auto-Cluster" para agrupar automáticamente o crea clusters manualmente
          </p>
        </div>
      )}

      {/* Unclustered Keywords */}
      {unclusteredKeywords.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Keywords sin clasificar ({unclusteredKeywords.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {unclusteredKeywords.map((kw) => (
              <label key={kw.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedKeywords.includes(kw.id)}
                  onChange={() => toggleKeywordSelection(kw.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 truncate">{kw.keyword}</span>
              </label>
            ))}
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
                onClick={createCluster}
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
