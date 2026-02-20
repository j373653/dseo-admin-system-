'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { 
  Loader2, Trash2, CheckSquare, Square, XCircle, RefreshCw
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

function normalizeKeyword(keyword: string): string {
  let kw = keyword.toLowerCase().trim()
  
  kw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const words = kw.split(' ')
  const normalizedWords = words.map(word => {
    if (word.endsWith('ones')) return word.slice(0, -3)
    if (word.endsWith('os') || word.endsWith('as')) return word.slice(0, -2)
    if (word.endsWith('es')) return word.slice(0, -2)
    if (word.endsWith('s')) return word.slice(0, -1)
    return word
  })
  
  kw = normalizedWords.join(' ')
  
  kw = kw.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
  
  return kw.trim()
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

      const normalizedMap = new Map<string, { id: string; volume: number; ids: string[] }>()

      allKeywords.forEach((k: any) => {
        if (k.status === 'discarded') return
        
        const kw = String(k.keyword || '').trim()
        if (kw.length < 3) return
        
        const norm = normalizeKeyword(kw)
        
        if (normalizedMap.has(norm)) {
          const existing = normalizedMap.get(norm)!
          existing.volume += Number(k.search_volume) || 0
          existing.ids.push(k.id)
        } else {
          normalizedMap.set(norm, { 
            id: k.id, 
            volume: Number(k.search_volume) || 0, 
            ids: [k.id] 
          })
        }
      })

      let duplicatesRemoved = 0
      let shortRemoved = 0
      
      for (const [norm, data] of normalizedMap) {
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

      const shortKeywords = allKeywords.filter((k: any) => 
        k.status !== 'discarded' && String(k.keyword || '').trim().length < 3
      )
      
      if (shortKeywords.length > 0) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ status: 'discarded' })
          .in('id', shortKeywords.map((k: any) => k.id))
        shortRemoved = shortKeywords.length
      }

      await fetchData()
      alert(`Limpieza completada:\n• ${duplicatesRemoved} duplicados eliminados\n• ${shortRemoved} keywords muy cortas descartadas`)
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
    </div>
  )
}
