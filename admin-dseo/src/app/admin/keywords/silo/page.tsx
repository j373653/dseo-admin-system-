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

  useEffect(() => {
    const fetchSilos = async () => {
      try {
        const res = await fetch('/api/seo/silos')
        if (!res.ok) throw new Error('Error fetching silos')
        const data = await res.json()
        // Normalize to our type
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

  if (loading) return <div>Cargando jerarquía SILO...</div>
  if (!silos || silos.length === 0) return <div>No hay silos</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">Silos</h2>
      <Link href="/admin/keywords/import"><button className="px-3 py-1 bg-indigo-600 text-white rounded">Importar</button></Link>
      <div className="mt-4 space-y-4">
        {silos.map((s) => (
          <div key={s.id} className="border rounded-lg p-4">
            <div className="font-semibold text-lg">{s.name}</div>
            {s.description && <div className="text-sm text-gray-600 mb-2">{s.description}</div>}
            <div className="ml-4 mt-2">
              {s.categories.map((c) => (
                <div key={c.id} className="mb-3">
                  <div className="font-medium">Categoría: {c.name}</div>
                  {c.pages.length > 0 ? (
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      {c.pages.map((p) => (
                        <li key={p.id}>
                          {p.main_keyword} — <span className="text-gray-500">{p.url_target}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">Sin páginas</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
