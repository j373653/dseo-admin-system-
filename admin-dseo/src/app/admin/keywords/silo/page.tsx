"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SiloCategory = {
  id: string
  name: string
  description?: string
  pages: { id: string; main_keyword: string; url_target: string; is_pillar: boolean; content_type_target: string }[]
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
  const [catNameInput, setCatNameInput] = useState('')
  const [catDescInput, setCatDescInput] = useState('')
  const [pageMainInput, setPageMainInput] = useState('')
  const [pageUrlInput, setPageUrlInput] = useState('')
  const [pageIsPillar, setPageIsPillar] = useState(false)
  const [pageContentType, setPageContentType] = useState('blog')

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
            content_type_target: p.content_type_target
          }))
        }))
      }))
      setSilos(mapped)
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

  const createCategory = async () => {
    if (!selectedSiloId || !catNameInput.trim()) return
    const resp = await fetch(`/api/seo/silos/${selectedSiloId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ silo_id: selectedSiloId, name: catNameInput.trim(), description: catDescInput.trim() })
    })
    if (resp.ok) {
      await fetchSilos()
      setCatNameInput('')
      setCatDescInput('')
    }
  }

  const createPage = async () => {
    if (!selectedSiloId || !catNameInput) return
    // Find the category from local state
    const silo = (silos || []).find(s => s.id === selectedSiloId)
    const cat = ((silo?.categories) || []).find(c => c.name === catNameInput)
    if (!cat) return
    const resp = await fetch(`/api/seo/silos/${selectedSiloId}/categories/${cat.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: cat.id, main_keyword: pageMainInput.trim(), url_target: pageUrlInput.trim(), is_pillar: pageIsPillar, content_type_target: pageContentType })
    })
    if (resp.ok) {
      await fetchSilos()
      setPageMainInput('')
      setPageUrlInput('')
    }
  }

  if (loading) return <div>Cargando jerarquía SILO...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estructura SILO</h2>
        <Link href="/admin/keywords/pro          <button classposal">
Name="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            + Nueva Propuesta
          </button>
        </Link>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-2">Crear nuevo Silo</h3>
        <div className="flex gap-2">
          <input placeholder="Nombre del silo" value={nameInput} onChange={e => setNameInput(e.target.value)} className="border rounded px-3 py-2 flex-1" />
          <input placeholder="Descripción (opcional)" value={descInput} onChange={e => setDescInput(e.target.value)} className="border rounded px-3 py-2 flex-1" />
          <button onClick={createSilo} className="px-4 py-2 bg-indigo-600 text-white rounded">Crear Silo</button>
        </div>
      </div>

      {!silos || silos.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          <div className="text-lg mb-2">No hay silos creados</div>
          <p>Crea uno arriba o ve a "Nueva Propuesta" para generar uno con IA</p>
        </div>
      ) : (
      <div className="space-y-6">
        {silos.map((s) => (
          <div key={s.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xl font-bold text-indigo-700">{s.name}</div>
              {s.description && <span className="text-sm text-gray-500">- {s.description}</span>}
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                {s.categories?.length || 0} categorías
              </span>
            </div>
            
            {s.categories && s.categories.length > 0 && (
              <div className="ml-4 space-y-3">
                {s.categories.map((c) => (
                  <div key={c.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="font-semibold text-green-700">{c.name}</div>
                    {c.description && <div className="text-sm text-gray-500 mb-2">{c.description}</div>}
                    
                    {c.pages && c.pages.length > 0 && (
                      <div className="ml-4 mt-2 space-y-2">
                        {c.pages.map((p) => (
                          <div key={p.id} className={`p-2 rounded ${p.is_pillar ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              {p.is_pillar && <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">PILLAR</span>}
                              <span className={`text-xs px-1 rounded ${p.content_type_target === 'service' ? 'bg-blue-100 text-blue-800' : p.content_type_target === 'landing' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                                {p.content_type_target}
                              </span>
                            </div>
                            <div className="font-medium">{p.main_keyword}</div>
                            {p.url_target && <div className="text-xs text-blue-600">{p.url_target}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2"><strong>Crear Categoría en este Silo</strong></div>
              <div className="flex space-x-2">
                <input 
                  placeholder="Nombre categoría" 
                  value={selectedSiloId === s.id ? catNameInput : ''} 
                  onChange={e => { setSelectedSiloId(s.id); setCatNameInput(e.target.value); }} 
                  className="border rounded px-2 py-1 flex-1" 
                />
                <button 
                  onClick={() => { setSelectedSiloId(s.id); createCategory(); }} 
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
