'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'
import ModelSelector from '@/components/ModelSelector'
import { 
  Loader2, ChevronRight, ChevronLeft, Check, 
  Network, GitBranch, Link2, ArrowRight
} from 'lucide-react'

interface Keyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number | null
}

interface Cluster {
  id: string
  name: string
  intent: string
  keywords: string[]
}

interface UrlPage {
  pilar: string
  categoria: string
  slug: string
  main_keyword: string
  secondary_keywords: string[]
  cluster_type: 'pillar' | 'support'
  intent: string
  entity: string
  content_difficulty: string
  internal_linking: string[]
}

export default function UrlsWizardPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Paso 1: Keywords
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([])
  const [loadingKeywords, setLoadingKeywords] = useState(true)

  // Paso 2: Clusters
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [analyzingClusters, setAnalyzingClusters] = useState(false)
  const [editingClusters, setEditingClusters] = useState<Cluster[]>([])
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([])

  // Paso 3: URLs
  const [generatingUrls, setGeneratingUrls] = useState(false)
  const [generatedUrls, setGeneratedUrls] = useState<UrlPage[]>([])
  const [editingUrls, setEditingUrls] = useState<UrlPage[]>([])

  // Modelo IA
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedApiKeyEnvVar, setSelectedApiKeyEnvVar] = useState('')

  // Cargar keywords pendientes al inicio
  useEffect(() => {
    loadPendingKeywords()
  }, [])

  const loadPendingKeywords = async () => {
    try {
      const { data } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, difficulty')
        .eq('status', 'pending')
        .order('search_volume', { ascending: false })
      setKeywords(data || [])
    } catch (err: any) {
      console.error('Error loading keywords:', err)
      setError('Error cargando keywords')
    } finally {
      setLoadingKeywords(false)
    }
  }

  const toggleKeyword = (id: string) => {
    setSelectedKeywordIds(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    )
  }

  // Paso 2: Analizar clusters
  const analyzeClusters = async () => {
    if (selectedKeywordIds.length === 0) {
      setError('Selecciona al menos una keyword')
      return
    }
    if (!selectedModel) {
      setError('Selecciona un modelo de IA')
      return
    }

    setAnalyzingClusters(true)
    setError('')

    try {
      const selectedKeywords = keywords.filter(k => selectedKeywordIds.includes(k.id)).map(k => k.keyword)
      
      const res = await fetch('/api/ai/analyze-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: selectedKeywords,
          model: selectedModel,
          provider: selectedProvider,
          apiKeyEnvVar: selectedApiKeyEnvVar
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en análisis')

      // Mapear clusters al formato esperado
      const clustersMapping = (data.clusters || []).map((c: any, idx: number) => ({
        id: `cluster_${idx}_${Date.now()}`,
        name: c.name,
        intent: c.intent || 'informational',
        keywords: c.keywords || []
      }))

      setClusters(clustersMapping)
      setEditingClusters(clustersMapping)
      setSelectedClusterIds(clustersMapping.map((c: any) => c.id))
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzingClusters(false)
    }
  }

  // Paso 2: Editar clusters
  const updateClusterName = (clusterId: string, newName: string) => {
    setEditingClusters(prev => prev.map((c: any) => 
      c.id === clusterId ? { ...c, name: newName } : c
    ))
  }

  const toggleClusterSelection = (clusterId: string) => {
    setSelectedClusterIds(prev => 
      prev.includes(clusterId) ? prev.filter(id => id !== clusterId) : [...prev, clusterId]
    )
  }

  // Paso 2 → Paso 3: Generar URLs
  const generateUrlsFromClusters = async () => {
    if (selectedClusterIds.length === 0) {
      setError('Selecciona al menos un cluster')
      return
    }

    setGeneratingUrls(true)
    setError('')

    try {
      // Mapear clusters seleccionados (usar los de editingClusters)
      const selectedClusters = editingClusters.filter(c => selectedClusterIds.includes(c.id))

      // Obtener estructura existente (si la hay) para pasar al backend
      const { data: existingSilos } = await supabaseClient
        .from('d_seo_admin_silos')
        .select(`
          id, name, priority,
          categories: d_seo_admin_categories (id, name, subcategory, pages: d_seo_admin_pages (id, main_keyword, slug, type, is_pillar, intent, entity, content_difficulty, internal_linking))
        `)
      
      const { data: existingPages } = await supabaseClient
        .from('d_seo_admin_pages')
        .select('slug')

      const existingStructure = {
        silos: existingSilos || [],
        existingSlugs: existingPages?.map(p => p.slug) || []
      }

      const res = await fetch('/api/seo/urls-from-clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusters: selectedClusters,
          existingStructure,
          model: selectedModel,
          provider: selectedProvider,
          apiKeyEnvVar: selectedApiKeyEnvVar
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando URLs')

      setGeneratedUrls(data.urls || [])
      setEditingUrls(data.urls || [])
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingUrls(false)
    }
  }

  // Paso 3: Editar URLs
  const updateUrlSlug = (index: number, slug: string) => {
    setEditingUrls(prev => prev.map((u, i) => i === index ? { ...u, slug } : u))
  }

  const updateUrlMainKeyword = (index: number, main_keyword: string) => {
    setEditingUrls(prev => prev.map((u, i) => i === index ? { ...u, main_keyword } : u))
  }

  const addSecondaryKeyword = (urlIndex: number, kw: string) => {
    setEditingUrls(prev => prev.map((u, i) => 
      i === urlIndex && kw && !u.secondary_keywords.includes(kw)
        ? { ...u, secondary_keywords: [...u.secondary_keywords, kw] }
        : u
    ))
  }

  const removeSecondaryKeyword = (urlIndex: number, kw: string) => {
    setEditingUrls(prev => prev.map((u, i) => 
      i === urlIndex ? { ...u, secondary_keywords: u.secondary_keywords.filter(k => k !== kw) } : u
    ))
  }

  // Paso 3 → Aplicar: Guardar en BD
  const applyStructure = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Crear/actualizar silos y categorías basados en editingUrls
      // Por simplicidad, vamos a agrupar por pilar y categoría
      const grouped: Record<string, Record<string, UrlPage[]>> = {}
      editingUrls.forEach(url => {
        if (!grouped[url.pilar]) grouped[url.pilar] = {}
        if (!grouped[url.pilar][url.categoria]) grouped[url.pilar][url.categoria] = []
        grouped[url.pilar][url.categoria].push(url)
      })

      // Para cada pilar → categoría → página: guardar en BD
      for (const [pilar, categories] of Object.entries(grouped)) {
        // Buscar o crear silo
        const { data: silo } = await supabaseClient
          .from('d_seo_admin_silos')
          .select('id')
          .eq('name', pilar)
          .single()

         let siloId = silo?.id
         if (!siloId) {
           const { data: newSilo } = await supabaseClient
             .from('d_seo_admin_silos')
             .insert({ name: pilar, priority: 1 })
             .select('id')
             .single()
           siloId = newSilo?.id
         }

         // Categorías
         for (const [catName, pages] of Object.entries(categories)) {
           const { data: category } = await supabaseClient
             .from('d_seo_admin_categories')
             .select('id')
             .eq('silo_id', siloId)
             .eq('name', catName)
             .single()

           let categoryId = category?.id
           if (!categoryId) {
             const { data: newCat } = await supabaseClient
               .from('d_seo_admin_categories')
               .insert({ silo_id: siloId, name: catName })
               .select('id')
               .single()
             categoryId = newCat?.id
           }

          // Páginas
          for (const page of pages) {
            // Buscar keywords IDs para asignar
            const kwIds: string[] = []
            // main keyword
            const { data: mainKw } = await supabaseClient
              .from('d_seo_admin_raw_keywords')
              .select('id')
              .eq('keyword', page.main_keyword)
              .single()
            if (mainKw) kwIds.push(mainKw.id)

            // secondary keywords
            for (const sec of page.secondary_keywords) {
              const { data: secKw } = await supabaseClient
                .from('d_seo_admin_raw_keywords')
                .select('id')
                .eq('keyword', sec)
                .single()
              if (secKw) kwIds.push(secKw.id)
            }

            // Crear/actualizar página
            await supabaseClient
              .from('d_seo_admin_pages')
              .upsert({
                category_id: categoryId,
                main_keyword: page.main_keyword,
                slug: page.slug,
                type: page.cluster_type === 'pillar' ? 'landing' : 'blog',
                is_pillar: page.cluster_type === 'pillar',
                intent: page.intent,
                entity: page.entity,
                content_difficulty: page.content_difficulty,
                internal_linking: page.internal_linking
              }, { onConflict: 'slug' })
            // Aquí deberíamos también crear asignaciones de keywords
            // Pero por simplicidad, dejamos pendiente
          }
        }
      }

      setSuccess('Estructura aplicada correctamente')
      setTimeout(() => {
        window.location.href = '/admin/keywords'
      }, 1500)
    } catch (err: any) {
      setError('Error guardando: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingKeywords) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando keywords...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Generador de URLs desde Clusters</h1>

      {/* Error / Success */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Wizard Steps Indicator */}
      <div className="flex items-center mb-8">
        {[
          {num: 1, label: 'Seleccionar Keywords'},
          {num: 2, label: 'Revisar Clusters'},
          {num: 3, label: 'Generar URLs'}
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > s.num ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <span className={`ml-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {idx < 2 && <ChevronRight className="w-5 h-5 mx-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Paso 1: Seleccionar Keywords */}
      {step === 1 && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <ModelSelector 
              currentTask="cluster"
              onModelChange={(m, p, k) => {
                setSelectedModel(m)
                setSelectedProvider(p)
                setSelectedApiKeyEnvVar(k || '')
              }}
            />
            <button
              onClick={analyzeClusters}
              disabled={analyzingClusters || selectedKeywordIds.length === 0 || !selectedModel}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzingClusters ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Network className="w-4 h-4" />
              )}
              Continuar
            </button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left w-12">Sel</th>
                  <th className="p-3 text-left">Keyword</th>
                  <th className="p-3 text-left">Volumen</th>
                  <th className="p-3 text-left">Dificultad</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map(k => (
                  <tr key={k.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedKeywordIds.includes(k.id)}
                        onChange={() => toggleKeyword(k.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-3">{k.keyword}</td>
                    <td className="p-3">{k.search_volume?.toLocaleString()}</td>
                    <td className="p-3">{k.difficulty || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {selectedKeywordIds.length} keywords seleccionadas
          </p>
        </div>
      )}

      {/* Paso 2: Revisar Clusters */}
      {step === 2 && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={generateUrlsFromClusters}
              disabled={generatingUrls || selectedClusterIds.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generatingUrls ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4" />
              )}
              Generar URLs
            </button>
          </div>

          <p className="mb-4 text-gray-600">
            Selecciona los clusters que quieres usar para generar URLs
          </p>

          <div className="space-y-4">
            {editingClusters.map(cluster => (
              <div key={cluster.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedClusterIds.includes(cluster.id)}
                      onChange={() => toggleClusterSelection(cluster.id)}
                      className="w-5 h-5"
                    />
                    <div>
                      <input
                        type="text"
                        value={cluster.name}
                        onChange={(e) => updateClusterName(cluster.id, e.target.value)}
                        className="font-bold text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-600">
                        Intención: {cluster.intent}
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {cluster.keywords.length} keywords
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.keywords.map(kw => (
                    <span key={kw} className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: Generar URLs */}
      {step === 3 && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={applyStructure}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Aplicar Estructura
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(
              editingUrls.reduce((acc, url) => {
                if (!acc[url.pilar]) acc[url.pilar] = {}
                if (!acc[url.pilar][url.categoria]) acc[url.pilar][url.categoria] = []
                acc[url.pilar][url.categoria].push(url)
                return acc
              }, {} as Record<string, Record<string, UrlPage[]>>)
            ).map(([pilar, categories]) => (
              <div key={pilar} className="border rounded-lg p-6 bg-white">
                <h3 className="text-xl font-bold mb-4 text-blue-700">{pilar}</h3>
                {Object.entries(categories).map(([catName, pages]) => (
                  <div key={catName} className="mb-6 ml-4 border-l-4 border-gray-300 pl-4">
                    <h4 className="font-semibold text-lg mb-3 text-gray-700">{catName}</h4>
                    <div className="space-y-4">
                      {pages.map((page, idx) => {
                        const globalIdx = editingUrls.findIndex(u => u.slug === page.slug)
                        return (
                          <div key={page.slug} className="border rounded p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Slug</label>
                                <input
                                  type="text"
                                  value={page.slug}
                                  onChange={(e) => updateUrlSlug(globalIdx, e.target.value)}
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Keyword Principal</label>
                                <input
                                  type="text"
                                  value={page.main_keyword}
                                  onChange={(e) => updateUrlMainKeyword(globalIdx, e.target.value)}
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1">Keywords Secundarias</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {page.secondary_keywords.map(sec => (
                                  <span key={sec} className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded text-sm">
                                    {sec}
                                    <button
                                      onClick={() => removeSecondaryKeyword(globalIdx, sec)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <input
                                  type="text"
                                  placeholder="Añadir..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      addSecondaryKeyword(globalIdx, e.currentTarget.value.trim())
                                      e.currentTarget.value = ''
                                    }
                                  }}
                                  className="border rounded px-2 py-1 text-sm w-32"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div><strong>Tipo:</strong> {page.cluster_type}</div>
                              <div><strong>Intención:</strong> {page.intent}</div>
                              <div><strong>Entidad:</strong> {page.entity}</div>
                              <div><strong>Dificultad:</strong> {page.content_difficulty}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
