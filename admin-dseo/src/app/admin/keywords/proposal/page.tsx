"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import ModelSelector from '@/components/ModelSelector'

type PageData = {
  main_keyword: string
  secondary_keywords: string[]
  type: 'service' | 'blog' | 'landing'
  is_pillar: boolean
  intent: 'informational' | 'transactional' | 'commercial'
}

type CategoryData = {
  name: string
  pages: PageData[]
}

type SiloData = {
  name: string
  categories: CategoryData[]
}

type KeywordInfo = {
  id: string
  keyword: string
}

type FilterResult = {
  id: string
  keyword: string
  shouldDiscard: boolean
  reason: string
}

export default function ProposalPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Progress tracking
  const [analyzingProgress, setAnalyzingProgress] = useState({ current: 0, total: 0, status: '' })
  
  const [keywords, setKeywords] = useState<KeywordInfo[]>([])
  const [filterResults, setFilterResults] = useState<FilterResult[]>([])
  const [discardSelected, setDiscardSelected] = useState<string[]>([])
  const [autoDiscardedCount, setAutoDiscardedCount] = useState(0)
  
  const [proposal, setProposal] = useState<SiloData[]>([])
  const [intentions, setIntentions] = useState<{ [key: string]: string }>({})
  
  const [useExistingSilos, setUseExistingSilos] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedApiKeyEnvVar, setSelectedApiKeyEnvVar] = useState('')

  // Clusters disponibles para usar en la propuesta
  const [availableClusters, setAvailableClusters] = useState<{id: string, name: string, entity: string, keyword_count: number}[]>([])
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([])
  const [useExistingClusters, setUseExistingClusters] = useState(false)

  // Saved proposals from DB
  const [savedProposals, setSavedProposals] = useState<any[]>([])
  const [showProposalsModal, setShowProposalsModal] = useState(false)
  const [loadingProposals, setLoadingProposals] = useState(false)

  const [hasSavedProposal, setHasSavedProposal] = useState(false)

  useEffect(() => {
    loadPendingKeywords()
    checkSavedProposal()
    loadSavedProposals()
    loadAvailableClusters()
  }, [])

  const loadAvailableClusters = async () => {
    const { data, error } = await supabaseClient
      .from('d_seo_admin_keyword_clusters')
      .select('id, name, intent')
    
    console.log('Loading clusters:', data, 'error:', error)
    
    if (data) {
      const clustersWithCount = await Promise.all(
        data.map(async (cluster) => {
          const { count } = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .select('id', { count: 'exact', head: true })
            .eq('cluster_id', cluster.id)
          
          return {
            ...cluster,
            entity: cluster.intent || cluster.name,
            keyword_count: count || 0
          }
        })
      )
      setAvailableClusters(clustersWithCount)
    }
  }

  const checkSavedProposal = () => {
    const saved = localStorage.getItem('dseo_last_proposal')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.proposal && data.proposal.length > 0) {
          setHasSavedProposal(true)
        }
      } catch (e) {
        console.error('Error checking saved proposal:', e)
      }
    }
  }

  const loadSavedProposal = () => {
    const saved = localStorage.getItem('dseo_last_proposal')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.proposal && data.proposal.length > 0) {
          setProposal(data.proposal)
          setIntentions(data.intentions || {})
          setDiscardSelected(data.discardSelected || [])
          setStep(3)
        }
      } catch (e) {
        console.error('Error loading saved proposal:', e)
      }
    }
  }

  const clearSavedProposal = () => {
    localStorage.removeItem('dseo_last_proposal')
    setHasSavedProposal(false)
  }

  // ============= DB Proposals Functions =============
  const loadSavedProposals = async () => {
    try {
      const res = await fetch('/api/seo/proposals')
      const data = await res.json()
      if (data.proposals) {
        setSavedProposals(data.proposals)
      }
    } catch (err) {
      console.error('Error loading saved proposals:', err)
    }
  }

  const saveProposalToDB = async () => {
    if (proposal.length === 0) return
    
    setLoadingProposals(true)
    try {
      const res = await fetch('/api/seo/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal,
          intentions,
          discardSelected,
          keywordsCount: filterResults.filter(r => !discardSelected.includes(r.id)).length
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Propuesta guardada correctamente')
        loadSavedProposals()
      }
    } catch (err) {
      console.error('Error saving proposal:', err)
    } finally {
      setLoadingProposals(false)
    }
  }

  const loadProposalFromDB = (proposalData: any) => {
    setProposal(proposalData.proposal)
    setIntentions(proposalData.intentions || {})
    setDiscardSelected(proposalData.discard_selected || [])
    setStep(3)
    setShowProposalsModal(false)
  }

  const deleteProposalFromDB = async (id: string) => {
    try {
      const res = await fetch(`/api/seo/proposals?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        loadSavedProposals()
      }
    } catch (err) {
      console.error('Error deleting proposal:', err)
    }
  }

  // =================================================

  const loadPendingKeywords = async () => {
    try {
      const res = await fetch('/api/seo/keywords?status=pending')
      const data = await res.json()
      if (data.keywords) {
        setKeywords(data.keywords)
      }
    } catch (err) {
      console.error('Error loading keywords:', err)
    }
  }

  const handleFilterByTopic = async () => {
    if (keywords.length === 0) {
      setError('No hay keywords pendientes')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/seo/filter-by-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await res.json()
      
      if (data.results) {
        setFilterResults(data.results)
        setDiscardSelected(data.results.filter((r: FilterResult) => r.shouldDiscard).map((r: FilterResult) => r.id))
        setAutoDiscardedCount(data.autoDiscarded || 0)
        setStep(2)
      } else {
        setError(data.error || 'Error al filtrar')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeWithAI = async () => {
    console.log('=== DEBUG ANALYZE ===')
    console.log('keywords:', keywords.length)
    console.log('discardSelected:', discardSelected.length)
    console.log('step:', step)
    console.log('useExistingSilos:', useExistingSilos)
    
    setLoading(true)
    setError('')

    // Calcular progreso estimado
    const keywordIds = filterResults
      .filter(r => !discardSelected.includes(r.id))
      .map(r => r.id)
      .filter(Boolean)
    
    const estimatedBatches = Math.ceil(keywordIds.length / 40)
    setAnalyzingProgress({ current: 0, total: estimatedBatches, status: 'Iniciando análisis...' })

    // Interval para mostrar progreso
    let progressInterval: NodeJS.Timeout | undefined = undefined
    if (keywordIds.length > 0) {
      let batchCounter = 0
      progressInterval = setInterval(() => {
        batchCounter++
        if (batchCounter < estimatedBatches) {
          setAnalyzingProgress({ 
            current: batchCounter, 
            total: estimatedBatches, 
            status: `Analizando batch ${batchCounter} de ${estimatedBatches}...` 
          })
        }
      }, 30000) // Actualizar cada 30 segundos (tiempo estimado por batch)
    }

    // Obtener clusters precomputados si se seleccionaron
    let precomputedClusters: {name: string, entity: string, keywords: string[]}[] | undefined = undefined
    if (useExistingClusters && selectedClusterIds.length > 0) {
      const { data: clusterKeywords } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, cluster_id')
        .in('cluster_id', selectedClusterIds)
      
      if (clusterKeywords && clusterKeywords.length > 0) {
        // Agrupar por cluster
        const clustersMap = new Map<string, {name: string, entity: string, keywords: string[]}>()
        
        for (const kw of clusterKeywords) {
          const cluster = availableClusters.find(c => c.id === kw.cluster_id)
          if (!cluster) continue
          
          if (!clustersMap.has(cluster.id)) {
            clustersMap.set(cluster.id, {
              name: cluster.name,
              entity: cluster.entity || cluster.name,
              keywords: []
            })
          }
          clustersMap.get(cluster.id)!.keywords.push(kw.keyword)
        }
        
        precomputedClusters = Array.from(clustersMap.values())
      }
    }

    try {
      console.log('keywordIds for AI analysis (pending):', keywordIds.length)
      console.log('discardSelected:', discardSelected.length)
      console.log('autoDiscardedCount:', autoDiscardedCount)
      console.log('precomputedClusters:', precomputedClusters?.length || 0)

      if (keywordIds.length === 0) {
        setError('No hay keywords pendientes para analizar. Todas fueron descartadas. Usa el botón "Descartar Todas" para aplicar los descartes.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/seo/analyze-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywordIds,
          useExistingSilos,
          model: selectedModel || undefined,
          provider: selectedProvider || undefined,
          apiKeyEnvVar: selectedApiKeyEnvVar || undefined,
          precomputedClusters
        })
      })

      const data = await res.json()

      console.log('API response:', data)
      
      if (data.proposal) {
        setProposal(data.proposal)
        setIntentions(data.intentions || {})
        
        // Mostrar info de progreso real
        if (data.batchesProcessed) {
          setAnalyzingProgress({ 
            current: data.batchesProcessed, 
            total: data.batchesProcessed, 
            status: `Completado: ${data.batchesProcessed} batches procesados` 
          })
        }
        
        // Guardar propuesta y avanzar al paso 3
        const proposalData = {
          proposal: data.proposal,
          intentions: data.intentions || {},
          discardSelected,
          validationErrors: data.validationErrors || [],
          savedAt: new Date().toISOString()
        }
        localStorage.setItem('dseo_last_proposal', JSON.stringify(proposalData))
        setHasSavedProposal(true)
        
        // Mostrar warning si hay errores de validación
        if (data.validationErrors && data.validationErrors.length > 0) {
          setError(`Warning: ${data.validationErrors.length} keywords no se encontraron en la lista original: ${data.validationErrors.slice(0, 3).join(', ')}...`)
        }
        
        setStep(3)
      } else {
        setError(data.error + (data.debug ? ` (debug: ${JSON.stringify(data.debug)}` : ''))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (progressInterval) clearInterval(progressInterval)
    }
  }

  const handleApplyProposal = async () => {
    setApplying(true)
    setError('')

    try {
      // Guardar automáticamente la propuesta antes de aplicar
      const saveRes = await fetch('/api/seo/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal,
          intentions,
          discardSelected,
          keywordsCount: filterResults.filter(r => !discardSelected.includes(r.id)).length
        })
      })
      const saveData = await saveRes.json()
      if (saveData.success) {
        console.log('Propuesta guardada automáticamente')
        loadSavedProposals()
      }

      const discardIds = discardSelected
      const keepPendingIds = keywords
        .filter(k => !proposal.flatMap(s => s.categories || []).flatMap(c => c.pages || []).flatMap(p => [p.main_keyword, ...(p.secondary_keywords || [])]).some(pk => pk.toLowerCase() === k.keyword.toLowerCase()))
        .filter(k => !discardSelected.includes(k.id))
        .map(k => k.id)

      const res = await fetch('/api/seo/apply-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: { silos: proposal },
          discardKeywordIds: discardIds,
          keepPendingKeywordIds: keepPendingIds
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(`Propuesta aplicada: ${data.results.keywordsClustered} keywords clusterizadas, ${data.results.keywordsDiscarded} descartadas`)
        setStep(4)
      } else {
        setError(data.error || 'Error al aplicar')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  const handleConfirmDiscardAll = async () => {
    setShowConfirmDiscard(false)
    setLoading(true)
    setError('')

    try {
      const discardIds = discardSelected.filter(Boolean)
      
      if (discardIds.length === 0) {
        setError('No hay keywords para descartar')
        setLoading(false)
        return
      }

      const res = await fetch('/api/seo/discard-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordIds: discardIds })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(`${data.count} keywords descartadas correctamente`)
        setShowConfirmDiscard(false)
        
        const proposalData = {
          proposal: [],
          intentions: {},
          discardSelected: [],
          keywordsDiscarded: data.count,
          savedAt: new Date().toISOString()
        }
        localStorage.setItem('dseo_last_proposal', JSON.stringify(proposalData))
        
        setStep(4)
      } else {
        setError(data.error || 'Error al descartar keywords')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateSiloName = (index: number, name: string) => {
    const newProposal: SiloData[] = [...proposal]
    newProposal[index].name = name
    setProposal(newProposal)
  }

  const updateCategoryName = (siloIndex: number, catIndex: number, name: string) => {
    const newProposal: SiloData[] = [...proposal]
    newProposal[siloIndex].categories[catIndex].name = name
    setProposal(newProposal)
  }

  const updatePage = (siloIndex: number, catIndex: number, pageIndex: number, field: string, value: any) => {
    const newProposal: SiloData[] = [...proposal]
    const page = newProposal[siloIndex].categories[catIndex].pages[pageIndex] as PageData
    (page as any)[field] = value
    setProposal(newProposal)
  }

  const removePage = (siloIndex: number, catIndex: number, pageIndex: number) => {
    const newProposal: SiloData[] = [...proposal]
    newProposal[siloIndex].categories[catIndex].pages.splice(pageIndex, 1)
    setProposal(newProposal)
  }

  const removeCategory = (siloIndex: number, catIndex: number) => {
    const newProposal: SiloData[] = [...proposal]
    newProposal[siloIndex].categories.splice(catIndex, 1)
    setProposal(newProposal)
  }

  const removeSilo = (siloIndex: number) => {
    const newProposal: SiloData[] = [...proposal]
    newProposal.splice(siloIndex, 1)
    setProposal(newProposal)
  }

  const toggleDiscard = (id: string) => {
    if (discardSelected.includes(id)) {
      setDiscardSelected(discardSelected.filter(d => d !== id))
    } else {
      setDiscardSelected([...discardSelected, id])
    }
  }

  const handleRevertToPending = async (keywordId: string) => {
    try {
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'pending',
          discarded_at: null,
          discarded_reason: null
        })
        .eq('id', keywordId)
      
      setDiscardSelected(discardSelected.filter(d => d !== keywordId))
      setAutoDiscardedCount(Math.max(0, autoDiscardedCount - 1))
    } catch (err) {
      console.error('Error reverting to pending:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Propuesta de Clustering SILO</h1>
          <Link href="/admin/keywords">
            <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Volver</button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
                <span>Filtrar</span>
              </div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
                <span>Analizar</span>
              </div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
                <span>Revisar</span>
              </div>
              <div className={`flex items-center ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>4</div>
                <span>Aplicado</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 1: Filtrar por Temática</h2>
              <p className="text-gray-600 mb-4">
                Se analizarán {keywords.length} keywords pendientes para verificar que coinciden con la temática de d-seo.es
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handleFilterByTopic}
                  disabled={loading || keywords.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Analizando...' : 'Filtrar por Temática'}
                </button>
                
                {hasSavedProposal && (
                  <button
                    onClick={loadSavedProposal}
                    className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Re-aplicar última propuesta
                  </button>
                )}
                
                {proposal.length > 0 && step < 3 && (
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Continuar con propuesta actual
                  </button>
                )}

                {/* Botón para guardar propuesta */}
                {proposal.length > 0 && (
                  <button
                    onClick={saveProposalToDB}
                    disabled={loadingProposals}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loadingProposals ? 'Guardando...' : 'Guardar Propuesta'}
                  </button>
                )}

                {/* Botón para ver propuestas guardadas */}
                <button
                  onClick={() => setShowProposalsModal(true)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Mis Propuestas ({savedProposals.length})
                </button>
              </div>
              
              {hasSavedProposal && (
                <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="text-orange-700 text-sm">
                    Tienes una propuesta guardada. Puedes re-aplicarla o continuar desde donde lo dejaste.
                  </p>
                  <button
                    onClick={clearSavedProposal}
                    className="mt-2 text-xs text-orange-600 underline"
                  >
                    Borrar propuesta guardada
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 2: Revisar Keywords a Descartar</h2>
              
              <div className="mb-4 p-4 bg-yellow-50 rounded">
                <p className="font-semibold">
                  {discardSelected.length} keywords no coinciden con la temática
                </p>
                {autoDiscardedCount > 0 && (
                  <p className="text-sm text-yellow-700 mt-1">
                    ({autoDiscardedCount} fueron descartadas automáticamente por no ser relevantes para d-seo.es)
                  </p>
                )}
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">
                  💡 Las keywords descartadas automáticamente pueden ser reactivadas marcando la casilla correspondiente.
                  Luego se enviarán a analizar con IA.
                </p>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useExistingSilos}
                    onChange={(e) => setUseExistingSilos(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Considerar silos existentes para la propuesta</span>
                </label>
              </div>

              <div className="max-h-96 overflow-y-auto mb-4 border rounded">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Descartar</th>
                      <th className="p-2 text-left">Keyword</th>
                      <th className="p-2 text-left">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterResults.map((r) => (
                      <tr key={r.id} className={r.shouldDiscard ? 'bg-red-50' : 'bg-white'}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={discardSelected.includes(r.id)}
                            onChange={() => toggleDiscard(r.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-2">{r.keyword}</td>
                        <td className="p-2 text-sm text-gray-600">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selector de Clusters existentes */}
              {availableClusters.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="useExistingClusters"
                      checked={useExistingClusters}
                      onChange={(e) => setUseExistingClusters(e.target.checked)}
                      className="w-4 h-4 text-green-600"
                    />
                    <label htmlFor="useExistingClusters" className="font-medium text-green-800">
                      Usar clusters existentes como base
                    </label>
                  </div>
                  
                  {useExistingClusters && (
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {availableClusters.map(cluster => (
                        <label key={cluster.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedClusterIds.includes(cluster.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClusterIds([...selectedClusterIds, cluster.id])
                              } else {
                                setSelectedClusterIds(selectedClusterIds.filter(id => id !== cluster.id))
                              }
                            }}
                            className="w-4 h-4 text-green-600"
                          />
                          <span>{cluster.name}</span>
                          <span className="text-gray-500">({cluster.keyword_count} kw)</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 mt-4 items-center">
                <ModelSelector 
                  currentTask="silo" 
                  onModelChange={(model, provider, apiKeyEnvVar) => {
                    setSelectedModel(model)
                    setSelectedProvider(provider)
                    setSelectedApiKeyEnvVar(apiKeyEnvVar || '')
                  }}
                />
                <button
                  onClick={handleAnalyzeWithAI}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Analizando con IA...' : 'Analizar con IA'}
                </button>
                
                {discardSelected.length > 0 && (
                  <button
                    onClick={() => setShowConfirmDiscard(true)}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Descartar Todas las Keywords
                  </button>
                )}
              </div>

              {/* Progress indicator */}
              {loading && analyzingProgress.total > 1 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">{analyzingProgress.status}</span>
                    <span className="text-sm text-blue-600">{analyzingProgress.current}/{analyzingProgress.total} batches</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(analyzingProgress.current / analyzingProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    No cierres esta página. El análisis continúa en segundo plano.
                  </p>
                </div>
              )}

              {showConfirmDiscard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-bold mb-4">Confirmar Descarte</h3>
                    <p className="mb-4">
                      ¿Estás seguro de descartar <strong>{discardSelected.length}</strong> keywords?
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Estas keywords pasarán a estado "descartadas" y no se podrán usar para clustering.
                    </p>
                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={() => setShowConfirmDiscard(false)}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmDiscardAll}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? 'Descartando...' : 'Confirmar Descarte'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paso 3: Revisar y Aprobar Propuesta</h2>
              <p className="text-gray-600 mb-4">
                Edita la propuesta antes de aplicar. Puedes modificar nombres de silos, categorías, páginas y sus keywords.
              </p>

              <div className="space-y-6 max-h-[500px] overflow-y-auto">
                {proposal.map((silo, siloIndex) => (
                  <div key={siloIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={silo.name}
                        onChange={(e) => updateSiloName(siloIndex, e.target.value)}
                        className="text-lg font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-1"
                      />
                      <button
                        onClick={() => removeSilo(siloIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar Silo
                      </button>
                    </div>

                    <div className="ml-4 space-y-4">
                      {silo.categories.map((cat, catIndex) => (
                        <div key={catIndex} className="border-l-2 border-blue-300 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => updateCategoryName(siloIndex, catIndex, e.target.value)}
                              className="font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-1"
                            />
                            <button
                              onClick={() => removeCategory(siloIndex, catIndex)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>

                          <div className="space-y-3">
                            {cat.pages.map((page, pageIndex) => (
                              <div key={pageIndex} className="bg-white p-3 rounded border">
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                  <div>
                                    <label className="text-xs text-gray-500">Main Keyword</label>
                                    <input
                                      type="text"
                                      value={page.main_keyword}
                                      onChange={(e) => updatePage(siloIndex, catIndex, pageIndex, 'main_keyword', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Tipo</label>
                                    <select
                                      value={page.type}
                                      onChange={(e) => updatePage(siloIndex, catIndex, pageIndex, 'type', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                      <option value="service">Service</option>
                                      <option value="blog">Blog</option>
                                      <option value="landing">Landing</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                  <div>
                                    <label className="text-xs text-gray-500">Secondary Keywords</label>
                                    <input
                                      type="text"
                                      value={page.secondary_keywords?.join(', ') || ''}
                                      onChange={(e) => updatePage(siloIndex, catIndex, pageIndex, 'secondary_keywords', e.target.value.split(',').map(k => k.trim()))}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Intención</label>
                                    <select
                                      value={page.intent}
                                      onChange={(e) => updatePage(siloIndex, catIndex, pageIndex, 'intent', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                      <option value="informational">Informational</option>
                                      <option value="transactional">Transactional</option>
                                      <option value="commercial">Commercial</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center space-x-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={page.is_pillar}
                                      onChange={(e) => updatePage(siloIndex, catIndex, pageIndex, 'is_pillar', e.target.checked)}
                                    />
                                    <span>Página Pillar</span>
                                  </label>
                                  <button
                                    onClick={() => removePage(siloIndex, catIndex, pageIndex)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Eliminar página
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleApplyProposal}
                  disabled={applying}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {applying ? 'Aplicando...' : 'Aplicar Propuesta'}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              {success ? (
                <>
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold mb-2">Proceso Completado</h2>
                  <p className="text-gray-600 mb-6">{success}</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold mb-2">¡Propuesta Aplicada!</h2>
                  <p className="text-gray-600 mb-6">
                    La estructura SILO ha sido creada y las keywords han sido asignadas.
                  </p>
                </>
              )}
              <Link href="/admin/keywords">
                <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Ver Keywords
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Mis Propuestas Guardadas */}
      {showProposalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mis Propuestas Guardadas</h2>
              <button
                onClick={() => setShowProposalsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {savedProposals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay propuestas guardadas
              </p>
            ) : (
              <div className="space-y-3">
                {savedProposals.map((p) => (
                  <div key={p.id} className="border rounded p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-gray-500">
                        {p.keywords_count} keywords • {new Date(p.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadProposalFromDB(p)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => deleteProposalFromDB(p.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              Máximo 3 propuestas guardadas. Las más antiguas se eliminan automáticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
