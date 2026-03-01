'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import ModelSelector from '@/components/ModelSelector'
import { 
  Loader2, ChevronRight, ChevronLeft, Check, 
  Network, GitBranch, Link2, ArrowRight, Square, CheckSquare
} from 'lucide-react'

interface Cluster {
  id: string
  name: string
  intent: string
  keyword_count: number
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

function getIntentBadgeColor(intent: string | null | undefined): string {
  const colors: Record<string, string> = {
    transactional: 'bg-blue-100 text-blue-800',
    commercial: 'bg-purple-100 text-purple-800',
    informational: 'bg-green-100 text-green-800',
    navigational: 'bg-yellow-100 text-yellow-800',
  }
  return colors[intent || ''] || 'bg-gray-100 text-gray-800'
}

function getIntentLabel(intent: string | null | undefined): string {
  if (!intent) return '-'
  return intent.charAt(0).toUpperCase() + intent.slice(1)
}

export default function UrlsWizardPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Paso 1: Clusters de BD
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([])
  const [loadingClusters, setLoadingClusters] = useState(true)

  // Paso 2: Clusters editados (para generar URLs)
  const [editingClusters, setEditingClusters] = useState<Cluster[]>([])

  // Paso 3: URLs
  const [generatingUrls, setGeneratingUrls] = useState(false)
  const [generatedUrls, setGeneratedUrls] = useState<UrlPage[]>([])
  const [editingUrls, setEditingUrls] = useState<UrlPage[]>([])

  // Modelo IA
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedApiKeyEnvVar, setSelectedApiKeyEnvVar] = useState('')

  // Cargar clusters de BD al inicio
  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
    try {
      setLoadingClusters(true)
      const { data } = await supabaseClient
        .from('d_seo_admin_keyword_clusters')
        .select('id, name, intent, keyword_count')
        .order('keyword_count', { ascending: false })
      setClusters(data || [])
    } catch (err: any) {
      console.error('Error loading clusters:', err)
      setError('Error cargando clusters')
    } finally {
      setLoadingClusters(false)
    }
  }

  const toggleClusterSelection = (clusterId: string) => {
    setSelectedClusterIds(prev => 
      prev.includes(clusterId) 
        ? prev.filter(id => id !== clusterId)
        : [...prev, clusterId]
    )
  }

  const handleNextFromStep1 = () => {
    const selected = clusters.filter(c => selectedClusterIds.includes(c.id))
    setEditingClusters(selected)
    setStep(2)
  }

  // Paso 2: Generar URLs desde clusters

  // Paso 2 → Paso 3: Generar URLs
  const generateUrlsFromClusters = async () => {
    if (selectedClusterIds.length === 0) {
      setError('Selecciona al menos un cluster')
      return
    }

    if (!selectedModel) {
      setError('Selecciona un modelo de IA')
      return
    }

    // VALIDACIÓN: Detectar keywords duplicadas entre clusters seleccionados
    const clusterKeywordsMap: Record<string, string[]> = {}
    for (const clusterId of selectedClusterIds) {
      const { data: keywords } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('keyword')
        .eq('cluster_id', clusterId)
      
      const cluster = editingClusters.find(c => c.id === clusterId)
      if (cluster && keywords) {
        clusterKeywordsMap[clusterId] = keywords.map(k => k.keyword.toLowerCase().trim())
      }
    }

    // Encontrar keywords que aparecen en múltiples clusters
    const keywordToClusters: Record<string, string[]> = {}
    for (const [clusterId, kws] of Object.entries(clusterKeywordsMap)) {
      const clusterName = editingClusters.find(c => c.id === clusterId)?.name || clusterId
      for (const kw of kws) {
        if (!keywordToClusters[kw]) keywordToClusters[kw] = []
        keywordToClusters[kw].push(clusterName)
      }
    }

    const duplicates = Object.entries(keywordToClusters)
      .filter(([_, clusters]) => clusters.length > 1)
      .slice(0, 10) // Limitar a 10 para mostrar

    if (duplicates.length > 0) {
      const dupList = duplicates.map(([kw, clusters]) => `"${kw}" (en: ${clusters.join(', ')})`).join('\n')
      const proceed = confirm(`⚠️ ADVERTENCIA: Las siguientes keywords aparecen en múltiples clusters:\n\n${dupList}\n\n${duplicates.length > 10 ? `... y ${duplicates.length - 10} más` : ''}\n\nEsto puede causar canibalización. ¿Continuar de todas formas?`)
      if (!proceed) {
        setGeneratingUrls(false)
        return
      }
    }

    setGeneratingUrls(true)
    setError('')

    try {
      // Obtener keywords de los clusters seleccionados
      const clustersWithKeywords: any[] = []
      for (const clusterId of selectedClusterIds) {
        const { data: keywords } = await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('keyword')
          .eq('cluster_id', clusterId)
        
        const cluster = editingClusters.find(c => c.id === clusterId)
        if (cluster) {
          clustersWithKeywords.push({
            id: cluster.id,
            name: cluster.name,
            intent: cluster.intent || 'informational',
            keywords: keywords?.map(k => k.keyword) || []
          })
        }
      }

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
          clusters: clustersWithKeywords,
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
            // Buscar keywords IDs para asignar (case-insensitive, UNO POR TEXTO)
            const kwIds: string[] = []
            const kwWarnings: string[] = []
            
            // main keyword - buscar solo el primero para evitar duplicados
            const { data: mainKw } = await supabaseClient
              .from('d_seo_admin_raw_keywords')
              .select('id, keyword, cluster_id')
              .ilike('keyword', page.main_keyword)
              .limit(1)
              .maybeSingle()
            
            if (mainKw) {
              // Verificar si ya está asignada a otro cluster/página
              if (mainKw.cluster_id) {
                kwWarnings.push(`"${page.main_keyword}" ya está en otro cluster`)
              }
              kwIds.push(mainKw.id)
            }

            // secondary keywords - buscar solo el primero para cada una
            for (const sec of page.secondary_keywords) {
              const { data: secKw } = await supabaseClient
                .from('d_seo_admin_raw_keywords')
                .select('id, keyword, cluster_id')
                .ilike('keyword', sec)
                .limit(1)
                .maybeSingle()
              
              if (secKw) {
                if (secKw.cluster_id && !kwIds.includes(secKw.id)) {
                  kwWarnings.push(`"${sec}" ya está en otro cluster`)
                }
                if (!kwIds.includes(secKw.id)) {
                  kwIds.push(secKw.id)
                }
              }
            }

            // Mostrar advertencias si hay keywords ya asignadas
            if (kwWarnings.length > 0) {
              console.warn('Keywords warnings:', kwWarnings)
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

  if (loadingClusters) {
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
          {num: 1, label: 'Seleccionar Clusters'},
          {num: 2, label: 'Generar URLs'},
          {num: 3, label: 'Revisar y Aplicar'}
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

      {/* Paso 1: Seleccionar Clusters */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Paso 1: Seleccionar Clusters</h2>
          <p className="text-gray-600 mb-4">
            Selecciona los clusters existentes para generar la estructura de URLs.
            Cada cluster se convertirá en páginas pilares y de soporte.
          </p>
          
          {loadingClusters ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-2">Cargando clusters...</span>
            </div>
          ) : clusters.length === 0 ? (
            <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">No hay clusters creados.</p>
              <p className="text-yellow-700 mt-2">
                Ve a <Link href="/admin/keywords/clusters" className="text-blue-600 hover:underline">Clusters</Link> para crear clusters primero.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {clusters.map(cluster => (
                <div 
                  key={cluster.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedClusterIds.includes(cluster.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleClusterSelection(cluster.id)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {selectedClusterIds.includes(cluster.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{cluster.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getIntentBadgeColor(cluster.intent)}`}>
                          {getIntentLabel(cluster.intent)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {cluster.keyword_count || 0} keywords
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNextFromStep1}
              disabled={selectedClusterIds.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente ({selectedClusterIds.length} clusters seleccionados)
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Generar URLs */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Paso 2: Generar URLs</h2>
          <p className="text-gray-600 mb-4">
            La IA analizará los clusters seleccionados y propondrá una estructura de URLs optimizada.
          </p>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Clusters seleccionados:</h3>
            <div className="flex flex-wrap gap-2">
              {editingClusters.map(cluster => (
                <span key={cluster.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {cluster.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <ModelSelector 
              currentTask="silo"
              onModelChange={(m, p, k) => {
                setSelectedModel(m)
                setSelectedProvider(p)
                setSelectedApiKeyEnvVar(k || '')
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={generateUrlsFromClusters}
              disabled={generatingUrls || selectedClusterIds.length === 0 || !selectedModel}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generatingUrls ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4" />
              )}
              Generar URLs con IA
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Revisar y Aplicar */}
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
