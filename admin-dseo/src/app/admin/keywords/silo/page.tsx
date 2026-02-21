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

  useEffect(() => {
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
      setCatNameInput('').setCatDescInput('')
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
  if (!silos || silos.length === 0) return <div>No hay silos</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">Silos</h2>
      <Link href="/admin/keywords/import"><button className="px-3 py-1 bg-indigo-600 text-white rounded">Importar</button></Link>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {silos.map((s) => (
          <div key={s.id} className="border rounded-lg p-4">
            <div className="font-semibold text-lg">{s.name}</div>
            {s.description && <div className="text-sm text-gray-600 mb-2">{s.description}</div>}
            <div className="mb-2">
              <strong>Crear Categoría</strong>
              <div className="flex space-x-2 mt-2">
                <select value={selectedSiloId ?? ''} onChange={(e) => setSelectedSiloId(e.target.value)} className="border rounded px-2 py-1">
                  <option value="">Selecciona silo</option>
                  {silos.map((so) => (
                    <option key={so.id} value={so.id}>{so.name}</option>
                  ))}
                </select>
                <input placeholder="Nombre categoría" value={catNameInput} onChange={e => setCatNameInput(e.target.value)} className="border rounded px-2 py-1" />
                <button onClick={createCategory} className="px-3 py-1 bg-green-600 text-white rounded">Crear</button>
              </div>
            </div>
            {s.categories?.length ? (
              <div className="mt-2 text-sm text-gray-700">Categorías: {s.categories.map(c => c.name).join(', ')}</div>
            ) : null}
            <div className="mt-3">
              <strong>Crear Página (para la Categoría actual)</strong>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="flex space-x-2 items-center">
                  <input placeholder="Main keyword" value={pageMainInput} onChange={e => setPageMainInput(e.target.value)} className="border rounded px-2 py-1" />
                  <input placeholder="URLTarget" value={pageUrlInput} onChange={e => setPageUrlInput(e.target.value)} className="border rounded px-2 py-1" />
                  <label className="flex items-center space-x-1 text-sm"><input type="checkbox" checked={pageIsPillar} onChange={e => setPageIsPillar(e.target.checked)} /> Pillar</label>
                  <select value={pageContentType} onChange={e => setPageContentType(e.target.value)} className="border rounded px-2 py-1">
                    <option value="blog">Blog</option>
                    <option value="landing">Landing</option>
                    <option value="service">Service</option>
                  </select>
                  <button onClick={createPage} className="px-3 py-1 bg-blue-600 text-white rounded">Crear página</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
