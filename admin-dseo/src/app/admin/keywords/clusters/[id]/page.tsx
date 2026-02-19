'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { getIntentBadge, SearchIntent } from '@/lib/search-intent'
import { ArrowLeft, Loader2, MoreVertical, Trash2, ArrowRightLeft, Search, Filter, CheckSquare, Square, X, Save, FileText, Link2 } from 'lucide-react'

interface Cluster {
  id: string
  name: string
  description: string
  intent: string
  keyword_count: number
  search_volume_total: number
  created_at: string
  is_pillar_page: boolean
  parent_cluster_id: string | null
  pillar_content_data: Record<string, unknown> | null
}

interface Keyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number | null
  cpc: number | null
  intent: string | null
  cluster_id: string | null
  status: string
}

interface MoveTarget {
  id: string
  name: string
}

export default function ClusterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clusterId = params.id as string

  const [cluster, setCluster] = useState<Cluster | null>(null)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  
  // Modales
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [targetClusters, setTargetClusters] = useState<MoveTarget[]>([])
  const [selectedTargetCluster, setSelectedTargetCluster] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  
  // Pillar Page state
  const [isPillar, setIsPillar] = useState(false)
  const [pillarUrl, setPillarUrl] = useState('')
  const [pillarTitle, setPillarTitle] = useState('')
  const [pillarStatus, setPillarStatus] = useState<string>('planned')
  const [pillarNotes, setPillarNotes] = useState('')
  const [savingPillar, setSavingPillar] = useState(false)

  // Parent cluster options
  const [allClusters, setAllClusters] = useState<MoveTarget[]>([])
  const [parentCluster, setParentCluster] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [clusterId])

  useEffect(() => {
    filterKeywords()
  }, [keywords, searchTerm, intentFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener cluster
      const { data: clusterData } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('*')
        .eq('id', clusterId)
        .single()
      
      if (clusterData) {
        setCluster(clusterData)
        // Initialize pillar page fields
        setIsPillar(clusterData.is_pillar_page || false)
        setParentCluster(clusterData.parent_cluster_id || '')
        
        const pillarData = clusterData.pillar_content_data as Record<string, unknown> | null
        if (pillarData) {
          setPillarUrl((pillarData.url as string) || '')
          setPillarTitle((pillarData.title as string) || '')
          setPillarStatus((pillarData.status as string) || 'planned')
          setPillarNotes((pillarData.notes as string) || '')
        }
      }

      // Obtener keywords del cluster
      const { data: keywordsData } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('*')
        .eq('cluster_id', clusterId)
        .is('deleted_at', null)
        .order('search_volume', { ascending: false })

      setKeywords(keywordsData || [])

      // Obtener todos los clusters (para seleccionar padre)
      const { data: allClustersData } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('id, name')
        .neq('id', clusterId)
        .order('name')
      
      setAllClusters(allClustersData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterKeywords = () => {
    let filtered = [...keywords]
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(kw => 
        kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filtrar por intención
    if (intentFilter !== 'all') {
      filtered = filtered.filter(kw => kw.intent === intentFilter)
    }
    
    setFilteredKeywords(filtered)
  }

  const toggleKeywordSelection = (keywordId: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keywordId)
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    )
  }

  const toggleAllSelection = () => {
    if (selectedKeywords.length === filteredKeywords.length) {
      setSelectedKeywords([])
    } else {
      setSelectedKeywords(filteredKeywords.map(kw => kw.id))
    }
  }

  const openMoveModal = async () => {
    if (selectedKeywords.length === 0) return
    
    // Obtener clusters disponibles (excluyendo el actual)
    const { data } = await supabaseClient
      .from('d_seo_admin_keyword_clusters')
      .select('id, name')
      .neq('id', clusterId)
      .order('name')
    
    setTargetClusters(data || [])
    setShowMoveModal(true)
  }

  const moveKeywords = async () => {
    if (!selectedTargetCluster || selectedKeywords.length === 0) return
    
    setProcessing(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ cluster_id: selectedTargetCluster })
        .in('id', selectedKeywords)
      
      setShowMoveModal(false)
      setSelectedKeywords([])
      await fetchData()
    } catch (err) {
      console.error('Error moving keywords:', err)
      alert('Error al mover keywords')
    } finally {
      setProcessing(false)
    }
  }

  const removeFromCluster = async () => {
    if (selectedKeywords.length === 0) return
    
    setProcessing(true)
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ 
          cluster_id: null, 
          status: 'pending',
          intent: null
        })
        .in('id', selectedKeywords)
      
      setShowDeleteModal(false)
      setSelectedKeywords([])
      await fetchData()
      
      // Recargar para actualizar contadores
      window.location.reload()
    } catch (err) {
      console.error('Error removing keywords:', err)
      alert('Error al eliminar keywords del cluster')
    } finally {
      setProcessing(false)
    }
  }

  const deletePermanently = async () => {
    if (selectedKeywords.length === 0) return
    
    setProcessing(true)
    try {
      // Soft delete - mover a papelera
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_reason: 'user_deleted',
          cluster_id: null,
          status: 'deleted'
        })
        .in('id', selectedKeywords)
      
      setShowPermanentDeleteModal(false)
      setSelectedKeywords([])
      await fetchData()
      
      // Recargar para actualizar contadores
      window.location.reload()
    } catch (err) {
      console.error('Error deleting keywords:', err)
      alert('Error al eliminar keywords')
    } finally {
      setProcessing(false)
    }
  }

  const savePillarConfig = async () => {
    setSavingPillar(true)
    try {
      await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .update({
          is_pillar_page: isPillar,
          parent_cluster_id: parentCluster || null,
          pillar_content_data: {
            url: pillarUrl,
            title: pillarTitle,
            status: pillarStatus,
            notes: pillarNotes
          }
        })
        .eq('id', clusterId)

      await fetchData()
      alert('✅ Configuración de Pillar Page guardada')
    } catch (err) {
      console.error('Error saving pillar config:', err)
      alert('Error al guardar la configuración')
    } finally {
      setSavingPillar(false)
    }
  }

  const calculateMetrics = () => {
    const totalVolume = keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0)
    const avgDifficulty = keywords.length > 0
      ? Math.round(keywords.reduce((sum, kw) => sum + (kw.difficulty || 0), 0) / keywords.length)
      : 0
    const avgCpc = keywords.length > 0
      ? (keywords.reduce((sum, kw) => sum + (kw.cpc || 0), 0) / keywords.length).toFixed(2)
      : '0.00'
    
    return { totalVolume, avgDifficulty, avgCpc }
  }

  const getIntentDistribution = () => {
    const distribution: { [key: string]: number } = {}
    keywords.forEach(kw => {
      const intent = kw.intent || 'unknown'
      distribution[intent] = (distribution[intent] || 0) + 1
    })
    return distribution
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cluster no encontrado</p>
        <button
          onClick={() => router.push('/admin/keywords/clusters')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          ← Volver a Clusters
        </button>
      </div>
    )
  }

  const metrics = calculateMetrics()
  const intentDistribution = getIntentDistribution()
  const badge = getIntentBadge((cluster.intent || 'unknown') as SearchIntent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/keywords/clusters')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cluster.name}</h1>
            <p className="text-gray-600">{cluster.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Keywords</p>
          <p className="text-2xl font-bold text-gray-900">{cluster.keyword_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Volumen Total</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalVolume.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Dificultad Media</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.avgDifficulty}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">CPC Medio</p>
          <p className="text-2xl font-bold text-gray-900">€{metrics.avgCpc}</p>
        </div>
      </div>

      {/* Distribución de Intenciones */}
      {Object.keys(intentDistribution).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Distribución de Intenciones</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(intentDistribution).map(([intent, count]) => {
              const intentBadge = getIntentBadge(intent as SearchIntent)
              return (
                <span key={intent} className={`px-2 py-1 rounded text-xs ${intentBadge.color}`}>
                  {intentBadge.label}: {count}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Pillar Page Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuración Pillar Page</h3>
          </div>
          <button
            onClick={savePillarConfig}
            disabled={savingPillar}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {savingPillar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toggle Pillar */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Es Pillar Page</p>
              <p className="text-sm text-gray-500">Marcar si este cluster es una página pilar</p>
            </div>
            <button
              onClick={() => setIsPillar(!isPillar)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPillar ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPillar ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Parent Cluster */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link2 className="w-4 h-4 inline mr-1" />
              Cluster Padre (opcional)
            </label>
            <select
              value={parentCluster}
              onChange={(e) => setParentCluster(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Sin cluster padre</option>
              {allClusters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL de la página</label>
            <input
              type="text"
              value={pillarUrl}
              onChange={(e) => setPillarUrl(e.target.value)}
              placeholder="/servicios/seo/barcelona/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título del contenido</label>
            <input
              type="text"
              value={pillarTitle}
              onChange={(e) => setPillarTitle(e.target.value)}
              placeholder="SEO Barcelona - Agencia de posicionamiento"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={pillarStatus}
              onChange={(e) => setPillarStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="planned">Planificado</option>
              <option value="in_progress">En progreso</option>
              <option value="published">Publicado</option>
              <option value="update">Actualizar</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas / Estrategia</label>
            <textarea
              value={pillarNotes}
              onChange={(e) => setPillarNotes(e.target.value)}
              rows={3}
              placeholder="Notas sobre la estrategia de contenido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las intenciones</option>
              <option value="informational">Información</option>
              <option value="transactional">Transacción</option>
              <option value="commercial">Comercial</option>
              <option value="navigational">Navegación</option>
              <option value="unknown">Desconocida</option>
            </select>
          </div>

          {/* Acciones masivas */}
          {selectedKeywords.length > 0 && (
            <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-indigo-900 font-medium">
                {selectedKeywords.length} seleccionadas
              </span>
              <div className="h-4 w-px bg-indigo-300"></div>
              <button
                onClick={openMoveModal}
                className="flex items-center space-x-1 text-sm text-indigo-700 hover:text-indigo-900"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Mover</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-1 text-sm text-yellow-700 hover:text-yellow-900"
              >
                <X className="w-4 h-4" />
                <span>Quitar del cluster</span>
              </button>
              <button
                onClick={() => setShowPermanentDeleteModal(true)}
                className="flex items-center space-x-1 text-sm text-red-700 hover:text-red-900"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Keywords */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={toggleAllSelection}
                  className="flex items-center"
                >
                  {selectedKeywords.length === filteredKeywords.length && filteredKeywords.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keyword
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intención
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volumen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dificultad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPC
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredKeywords.map((keyword) => {
              const keywordBadge = getIntentBadge((keyword.intent || 'unknown') as SearchIntent)
              const isSelected = selectedKeywords.includes(keyword.id)
              
              return (
                <tr 
                  key={keyword.id}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => toggleKeywordSelection(keyword.id)}>
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${keywordBadge.color}`}>
                      {keywordBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {keyword.search_volume?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      (keyword.difficulty || 0) > 60 ? 'text-red-600' :
                      (keyword.difficulty || 0) > 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {keyword.difficulty || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {keyword.cpc ? `€${keyword.cpc}` : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredKeywords.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron keywords</p>
          </div>
        )}
      </div>

      {/* Modal: Mover a otro cluster */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mover {selectedKeywords.length} keywords a otro cluster
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {targetClusters.map((target) => (
                <label
                  key={target.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTargetCluster === target.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetCluster"
                    value={target.id}
                    checked={selectedTargetCluster === target.id}
                    onChange={(e) => setSelectedTargetCluster(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {target.name}
                  </span>
                </label>
              ))}
            </div>
            
            {targetClusters.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay otros clusters disponibles
              </p>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={moveKeywords}
                disabled={!selectedTargetCluster || processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Mover</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quitar del cluster */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Quitar del cluster
            </h3>
            <p className="text-gray-600 mb-4">
              Las {selectedKeywords.length} keywords seleccionadas volverán a estado "sin clasificar". 
              Podrás reclasificarlas más tarde.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={removeFromCluster}
                disabled={processing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Quitar del cluster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar permanentemente (Papelera) */}
      {showPermanentDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900">
                Eliminar keywords
              </h3>
            </div>
            <p className="text-gray-600 mb-2">
              Estás a punto de enviar {selectedKeywords.length} keywords a la papelera.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Las keywords irán a la papelera y podrás restaurarlas o eliminarlas permanentemente desde allí.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Estas keywords no aparecerán en análisis ni clusters hasta que se restauren.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPermanentDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={deletePermanently}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
