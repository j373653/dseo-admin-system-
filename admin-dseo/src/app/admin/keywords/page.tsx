'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Keyword {
  id: string
  keyword: string
  search_volume: number
  difficulty: number
  status: string
  cluster_id: string | null
  created_at: string
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    try {
      const { data, error, count } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      
      setKeywords(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching keywords:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Keywords</h2>
          <p className="text-gray-600">
            {totalCount} keywords importadas | {keywords.filter(k => !k.cluster_id).length} sin clasificar
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/keywords/import">
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Importar CSV
            </button>
          </Link>
          <Link href="/admin/keywords/clusters">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Ver Clusters
            </button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar keywords..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredKeywords.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volumen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dificultad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cluster</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKeywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {keyword.keyword}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.search_volume?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.difficulty ? `${keyword.difficulty}/100` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      keyword.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      keyword.status === 'clustered' ? 'bg-green-100 text-green-800' :
                      keyword.status === 'enriched' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {keyword.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {keyword.cluster_id ? (
                      <span className="text-green-600">✓ Asignado</span>
                    ) : (
                      <span className="text-yellow-600">Sin clasificar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay keywords importadas</h3>
          <p className="text-gray-500 mb-4">
            Importa tus keywords desde un archivo CSV para empezar a gestionarlas
          </p>
          <Link href="/admin/keywords/import">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Importar Keywords
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-500">No se encontraron keywords con ese término de búsqueda</p>
        </div>
      )}
    </div>
  )
}
