'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { detectSearchIntent } from '@/lib/search-intent'
import { 
  Loader2, Trash2, CheckSquare, Square, Filter, 
  Download, Move, XCircle, AlertTriangle, RefreshCw
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

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
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

      const kwData = keywordsRes.data || []
      
      const keywordsWithIntent = kwData.map(k => ({
        ...k,
        intent: k.intent || (detectSearchIntent(k.keyword)?.intent === 'unknown' ? null : detectSearchIntent(k.keyword)?.intent) || null
      }))

      setKeywords(keywordsWithIntent)
      setClusters(clustersRes.data || [])
      setTotalCount(countRes.count || 0)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const cleanDatabase = async () => {
    if (!confirm('⚠️ Esto limpiará la base de datos:\n\n• Eliminará duplicados exactos\n• Normalizará keywords (singular/plural)\n• Eliminará keywords muy cortas (<3 chars)\n\n¿Continuar?')) return

    setCleaning(true)
    try {
      const { data: allKeywords } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, status')
        .not('status', 'eq', 'discarded')

      if (!allKeywords) return

      const normalizedMap = new Map<string, { id: string; volume: number; ids: string[] }>()

      allKeywords.forEach(k => {
        const norm = k.keyword.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        
        if (norm.length < 3) return

        if (normalizedMap.has(norm)) {
          const existing = normalizedMap.get(norm)!
          existing.volume += k.search_volume || 0
          existing.ids.push(k.id)
        } else {
          normalizedMap.set(norm, { 
            id: k.id, 
            volume: k.search_volume || 0, 
            ids: [k.id] 
          })
        }
      })

      let duplicatesRemoved = 0
      for (const [_, data] of normalizedMap) {
        if (data.ids.length > 1) {
          const masterId = data.id
          const duplicateIds = data.ids.slice(1)

          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ search_volume: data.volume })
            .eq('id', masterId)

          await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .update({ status: 'discarded' })
            .in('id', duplicateIds)

          duplicatesRemoved += duplicateIds.length
        }
      }

      const shortKeywords = allKeywords.filter(k => k.keyword.trim().length < 3)
      if (shortKeywords.length > 0) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ status: 'discarded' })
          .in('id', shortKeywords.map(k => k.id))
      }

      await fetchData()
      alert(`✅ Limpieza completada:\n• ${duplicatesRemoved} duplicados eliminados\n• ${shortKeywords.length} keywords muy cortas descartadas`)
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error durante la limpieza')
    } finally {
      setCleaning(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredKeywords.map(k => k.id)))
    }
    setSelectAll(!selectAll)
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Descartar ${selectedIds.size} keywords? Se marcarán como descartadas.`)) return

    setActionLoading(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ status: 'discarded', cluster_id: null })
        .in('id', Array.from(selectedIds))

      setSelectedIds(new Set())
      setSelectAll(false)
      await fetchData()
      alert(`✅ ${selectedIds.size} keywords descartadas`)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const removeFromCluster = async () => {
    if (selectedIds.size === 0) return

    setActionLoading(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: null, status: 'pending' })
        .in('id', Array.from(selectedIds))

      setSelectedIds(new Set())
      setSelectAll(false)
      await fetchData()
      alert(`✅ ${selectedIds.size} keywords quitadas del cluster`)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getIntentBadge = (intent: string | null | undefined) => {
    const i = intent || 'unknown'
    const colors: Record<string, string> = {
      transactional: 'bg-blue-100 text-blue-800',
      commercial: 'bg-purple-100 text-purple-800',
      informational: 'bg-green-100 text-green-800',
      navigational: 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-800'
    }
    return colors[intent] || colors.unknown
  }

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || kw.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const clusterMap = new Map(clusters.map(c => [c.id, c.name]))

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
            {totalCount} keywords | {keywords.filter(k => !k.cluster_id).length} sin clasificar | {keywords.filter(k => k.status === 'discarded').length} descartadas
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={cleanDatabase}
            disabled={cleaning}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>🧹 Limpiar BBDD</span>
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

      {/* Acciones masivas */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <span className="text-indigo-700 font-medium">
            {selectedIds.size} keywords seleccionadas
          </span>
          <div className="flex space-x-3">
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

      {/* Filtros */}
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

      {/* Tabla */}
      {filteredKeywords.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-indigo-600 hover:text-indigo-800">
                      {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Volumen</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dificultad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Intent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => (
                  <tr key={keyword.id} className={`hover:bg-gray-50 ${keyword.status === 'discarded' ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(keyword.id)} className="text-indigo-600 hover:text-indigo-800">
                        {selectedIds.has(keyword.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {keyword.search_volume?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {keyword.difficulty ? `${keyword.difficulty}/100` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getIntentBadge(keyword.intent || 'unknown')}`}>
                        {keyword.intent || 'unknown'}
                      </span>
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
                          {clusterMap.get(keyword.cluster_id) || 'Cluster #' + keyword.cluster_id.slice(0,8)}
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
    </div>
  )
}
