"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Keyword = {
  id: string
  keyword: string
  search_volume: number
  intent: string
}

type Page = {
  id: string
  main_keyword: string
  url_target: string
  is_pillar: boolean
  content_type_target: string
  keywords?: Keyword[]
}

type SiloCategory = {
  id: string
  name: string
  description?: string
  pages: Page[]
}

type Silo = {
  id: string
  name: string
  description?: string
  categories: SiloCategory[]
}

export default function SilosPage() {
  const [silos, setSilos] = useState<Silo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [nameInput, setNameInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [selectedSiloId, setSelectedSiloId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [catNameInput, setCatNameInput] = useState('')
  const [catDescInput, setCatDescInput] = useState('')
  const [pageMainInput, setPageMainInput] = useState('')
  const [pageUrlInput, setPageUrlInput] = useState('')
  const [pageIsPillar, setPageIsPillar] = useState(false)
  const [pageContentType, setPageContentType] = useState('blog')
  const [showCatForm, setShowCatForm] = useState<string | null>(null)
  const [showPageForm, setShowPageForm] = useState<string | null>(null)
  const [editingSilo, setEditingSilo] = useState<string | null>(null)
  const [editSiloName, setEditSiloName] = useState('')
  const [editSiloDesc, setEditSiloDesc] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatDesc, setEditCatDesc] = useState('')
  const [editingPage, setEditingPage] = useState<string | null>(null)
  const [editPageKeyword, setEditPageKeyword] = useState('')
  const [editPageUrl, setEditPageUrl] = useState('')
  const [editPagePillar, setEditPagePillar] = useState(false)
  const [editPageType, setEditPageType] = useState('blog')
  const [expandedSilos, setExpandedSilos] = useState<Set<string>>(new Set())

  const fetchSilos = async () => {
    try {
      const res = await fetch('/api/seo/silos')
      if (!res.ok) throw new Error('Error fetching silos')
      const data = await res.json()
      const raw = data?.silos || []
      const mapped: Silo[] = raw.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        categories: (s.categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          pages: (c.pages || []).map((p: any) => ({
            id: p.id,
            main_keyword: p.main_keyword,
            url_target: p.url_target,
            is_pillar: p.is_pillar,
            content_type_target: p.content_type_target,
            keywords: p.keywords || []
          }))
        }))
      }))
      setSilos(mapped)
      if (mapped.length > 0) {
        setExpandedSilos(new Set(mapped.map(s => s.id)))
      }
    } catch (err) {
      console.error(err)
      setSilos(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSilos()
  }, [])

  const createSilo = async () => {
    if (!nameInput.trim()) return
    const resp = await fetch('/api/seo/silos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim(), description: descInput.trim() })
    })
    if (resp.ok) {
      await fetchSilos()
      setNameInput('')
      setDescInput('')
    }
  }

  const deleteSilo = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este silo y todas sus categorías y páginas?')) return
    const resp = await fetch(`/api/seo/silos?id=${id}`, { method: 'DELETE' })
    if (resp.ok) {
      await fetchSilos()
    }
  }

  const startEditSilo = (silo: Silo) => {
    setEditingSilo(silo.id)
    setEditSiloName(silo.name)
    setEditSiloDesc(silo.description || '')
  }

  const saveEditSilo = async (id: string) => {
    const resp = await fetch(`/api/seo/silos?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editSiloName, description: editSiloDesc })
    })
    if (resp.ok) {
      await fetchSilos()
      setEditingSilo(null)
    }
  }

  const createCategory = async (siloId: string) => {
    if (!catNameInput.trim()) return
    const resp = await fetch(`/api/seo/silos/${siloId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ silo_id: siloId, name: catNameInput.trim(), description: catDescInput.trim() })
    })
    if (resp.ok) {
      await fetchSilos()
      setCatNameInput('')
      setCatDescInput('')
      setShowCatForm(null)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría y todas sus páginas?')) return
    const resp = await fetch(`/api/seo/silos/1/categories?id=${id}`, { method: 'DELETE' })
    if (resp.ok) {
      await fetchSilos()
    }
  }

  const startEditCategory = (cat: SiloCategory) => {
    setEditingCategory(cat.id)
    setEditCatName(cat.name)
    setEditCatDesc(cat.description || '')
  }

  const saveEditCategory = async (id: string) => {
    const resp = await fetch(`/api/seo/silos/1/categories?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editCatName, description: editCatDesc })
    })
    if (resp.ok) {
      await fetchSilos()
      setEditingCategory(null)
    }
  }

  const createPage = async (categoryId: string, siloId: string) => {
    if (!pageMainInput.trim()) return
    const resp = await fetch(`/api/seo/silos/${siloId}/categories/${categoryId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        category_id: categoryId, 
        main_keyword: pageMainInput.trim(), 
        url_target: pageUrlInput.trim() || `/${pageMainInput.trim().toLowerCase().replace(/\s+/g, '-')}`, 
        is_pillar: pageIsPillar, 
        content_type_target: pageContentType 
      })
    })
    if (resp.ok) {
      await fetchSilos()
      setPageMainInput('')
      setPageUrlInput('')
      setShowPageForm(null)
    }
  }

  const deletePage = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta página?')) return
    const resp = await fetch(`/api/seo/silos/1/categories/1/pages?id=${id}`, { method: 'DELETE' })
    if (resp.ok) {
      await fetchSilos()
    }
  }

  const startEditPage = (page: Page) => {
    setEditingPage(page.id)
    setEditPageKeyword(page.main_keyword)
    setEditPageUrl(page.url_target || '')
    setEditPagePillar(page.is_pillar)
    setEditPageType(page.content_type_target)
  }

  const saveEditPage = async (id: string) => {
    const resp = await fetch(`/api/seo/silos/1/categories/1/pages?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        main_keyword: editPageKeyword, 
        url_target: editPageUrl,
        is_pillar: editPagePillar,
        content_type_target: editPageType
      })
    })
    if (resp.ok) {
      await fetchSilos()
      setEditingPage(null)
    }
  }

  const toggleSilo = (id: string) => {
    const newExpanded = new Set(expandedSilos)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSilos(newExpanded)
  }

  if (loading) return <div>Cargando jerarquía SILO...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estructura SILO</h2>
        <Link href="/admin/keywords/proposal">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            + Nueva Propuesta IA
          </button>
        </Link>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-2">Crear nuevo Silo</h3>
        <div className="flex gap-2">
          <input 
            placeholder="Nombre del silo (ej: Marketing Digital)" 
            value={nameInput} 
            onChange={e => setNameInput(e.target.value)} 
            className="border rounded px-3 py-2 flex-1"
            onKeyDown={e => e.key === 'Enter' && createSilo()}
          />
          <input 
            placeholder="Descripción (opcional)" 
            value={descInput} 
            onChange={e => setDescInput(e.target.value)} 
            className="border rounded px-3 py-2 flex-1"
          />
          <button onClick={createSilo} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Crear Silo
          </button>
        </div>
      </div>

      {!silos || silos.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          <div className="text-lg mb-2">No hay silos creados</div>
          <p>Crea uno arriba o ve a "Nueva Propuesta IA" para generar uno con IA</p>
        </div>
      ) : (
      <div className="space-y-4">
        {silos.map((s) => (
          <div key={s.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-indigo-50 cursor-pointer"
              onClick={() => toggleSilo(s.id)}
            >
              {editingSilo === s.id ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <input 
                    value={editSiloName} 
                    onChange={e => setEditSiloName(e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                    onKeyDown={e => e.key === 'Enter' && saveEditSilo(s.id)}
                  />
                  <input 
                    value={editSiloDesc} 
                    onChange={e => setEditSiloDesc(e.target.value)}
                    placeholder="Descripción"
                    className="border rounded px-2 py-1 flex-1"
                  />
                  <button onClick={() => saveEditSilo(s.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Guardar</button>
                  <button onClick={() => setEditingSilo(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-sm">Cancelar</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{expandedSilos.has(s.id) ? '▼' : '▶'}</span>
                    <div className="text-xl font-bold text-indigo-800">{s.name}</div>
                    {s.description && <span className="text-sm text-gray-500">- {s.description}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                      {s.categories?.length || 0} categorías
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditSilo(s); }}
                      className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSilo(s.id); }}
                      className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {expandedSilos.has(s.id) && (
              <div className="p-4 border-t">
                {s.categories && s.categories.length > 0 && (
                  <div className="space-y-3 ml-4">
                    {s.categories.map((c) => (
                      <div key={c.id} className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          {editingCategory === c.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-4">
                              <input 
                                value={editCatName} 
                                onChange={e => setEditCatName(e.target.value)}
                                className="border rounded px-2 py-1 flex-1"
                              />
                              <input 
                                value={editCatDesc} 
                                onChange={e => setEditCatDesc(e.target.value)}
                                placeholder="Descripción"
                                className="border rounded px-2 py-1 flex-1"
                              />
                              <button onClick={() => saveEditCategory(c.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Guardar</button>
                              <button onClick={() => setEditingCategory(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-sm">Cancelar</button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div className="font-semibold text-green-700 text-lg">{c.name}</div>
                                {c.description && <div className="text-sm text-gray-500 mb-2">{c.description}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => startEditCategory(c)}
                                  className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={() => deleteCategory(c.id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {c.pages && c.pages.length > 0 && (
                          <div className="ml-4 mt-3 space-y-2">
                            {c.pages.map((p) => (
                              <div key={p.id} className={`p-3 rounded ${p.is_pillar ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'}`}>
                                {editingPage === p.id ? (
                                  <div>
                                    <div className="flex gap-2 mb-2">
                                      <input 
                                        value={editPageKeyword} 
                                        onChange={e => setEditPageKeyword(e.target.value)}
                                        className="border rounded px-2 py-1 flex-1"
                                        placeholder="Keyword principal"
                                      />
                                      <input 
                                        value={editPageUrl} 
                                        onChange={e => setEditPageUrl(e.target.value)}
                                        className="border rounded px-2 py-1 flex-1"
                                        placeholder="URL"
                                      />
                                    </div>
                                    <div className="flex gap-2 items-center mb-2">
                                      <select 
                                        value={editPageType}
                                        onChange={e => setEditPageType(e.target.value)}
                                        className="border rounded px-2 py-1"
                                      >
                                        <option value="blog">Blog</option>
                                        <option value="service">Servicio</option>
                                        <option value="landing">Landing</option>
                                      </select>
                                      <label className="flex items-center gap-1 text-sm">
                                        <input 
                                          type="checkbox" 
                                          checked={editPagePillar}
                                          onChange={e => setEditPagePillar(e.target.checked)}
                                        />
                                        Pillar
                                      </label>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => saveEditPage(p.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Guardar</button>
                                      <button onClick={() => setEditingPage(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-sm">Cancelar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        {p.is_pillar && <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">PILLAR</span>}
                                        <span className={`text-xs px-1 rounded ${p.content_type_target === 'service' ? 'bg-blue-100 text-blue-800' : p.content_type_target === 'landing' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                                          {p.content_type_target}
                                        </span>
                                      </div>
                                      <div className="font-medium">{p.main_keyword}</div>
                                      {p.url_target && <div className="text-xs text-blue-600">{p.url_target}</div>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => startEditPage(p)}
                                        className="text-blue-500 hover:text-blue-700 text-sm"
                                      >
                                        Editar
                                      </button>
                                      <button 
                                        onClick={() => deletePage(p.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {p.keywords && p.keywords.length > 0 && (
                                  <div className="mt-2 pl-2 border-l-2 border-gray-300">
                                    <div className="text-xs text-gray-500 mb-1">Keywords asignadas:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {p.keywords.map((kw) => (
                                        <span key={kw.id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                          {kw.keyword}
                                          {kw.search_volume > 0 && <span className="text-gray-400 ml-1">({kw.search_volume})</span>}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {showPageForm === c.id ? (
                          <div className="ml-4 mt-3 p-3 bg-gray-100 rounded">
                            <div className="flex gap-2 mb-2">
                              <input 
                                placeholder="Keyword principal" 
                                value={pageMainInput} 
                                onChange={e => setPageMainInput(e.target.value)}
                                className="border rounded px-2 py-1 flex-1"
                              />
                              <select 
                                value={pageContentType}
                                onChange={e => setPageContentType(e.target.value)}
                                className="border rounded px-2 py-1"
                              >
                                <option value="blog">Blog</option>
                                <option value="service">Servicio</option>
                                <option value="landing">Landing</option>
                              </select>
                              <label className="flex items-center gap-1 text-sm">
                                <input 
                                  type="checkbox" 
                                  checked={pageIsPillar}
                                  onChange={e => setPageIsPillar(e.target.checked)}
                                />
                                Pillar
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <input 
                                placeholder="URL objetivo (opcional)" 
                                value={pageUrlInput} 
                                onChange={e => setPageUrlInput(e.target.value)}
                                className="border rounded px-2 py-1 flex-1"
                              />
                              <button 
                                onClick={() => createPage(c.id, s.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded"
                              >
                                Crear
                              </button>
                              <button 
                                onClick={() => setShowPageForm(null)}
                                className="px-3 py-1 bg-gray-400 text-white rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setSelectedCategoryId(c.id); setShowPageForm(c.id); }}
                            className="ml-4 mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Añadir Página
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showCatForm === s.id ? (
                  <div className="ml-4 mt-3 p-3 bg-gray-100 rounded">
                    <div className="flex gap-2 mb-2">
                      <input 
                        placeholder="Nombre de categoría" 
                        value={catNameInput} 
                        onChange={e => setCatNameInput(e.target.value)}
                        className="border rounded px-2 py-1 flex-1"
                      />
                      <input 
                        placeholder="Descripción (opcional)" 
                        value={catDescInput} 
                        onChange={e => setCatDescInput(e.target.value)}
                        className="border rounded px-2 py-1 flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => createCategory(s.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Crear
                      </button>
                      <button 
                        onClick={() => setShowCatForm(null)}
                        className="px-3 py-1 bg-gray-400 text-white rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setSelectedSiloId(s.id); setShowCatForm(s.id); }}
                    className="ml-4 mt-3 text-sm text-green-600 hover:text-green-800"
                  >
                    + Añadir Categoría
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
