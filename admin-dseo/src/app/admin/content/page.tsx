'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

const PROTECTED_URLS = [
  '/', '/servicios/', '/servicios/sitios-web/', '/servicios/sitios-web/legal/',
  '/servicios/sitios-web/wordpress/', '/servicios/ecommerce/', '/servicios/ia/',
  '/servicios/apps/', '/servicios/seo/', '/servicios/seo/local/',
  '/servicios/seo/ecommerce/', '/servicios/seo/tecnico/', '/servicios/seo/keyword-research/',
  '/servicios/sectores/', '/legal/aviso-legal/', '/legal/privacidad/', '/legal/cookies/'
]

interface Cluster {
  id: string
  name: string
  description: string
  keyword_count: number
  intent: string
  is_pillar_page: boolean
  parent_cluster_id: string | null
  pillar_content_data: Record<string, unknown> | null
}

interface ContentPage {
  id: string
  cluster_id: string
  suggested_url: string
  final_url: string | null
  status: 'draft' | 'review' | 'published'
  meta_title: string | null
  meta_description: string | null
  h1: string | null
  version: number
  published_at: string | null
  updated_at: string
}

function generateUrlSuggestion(clusterName: string): string {
  const slug = clusterName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  if (slug.includes('wordpress')) {
    return `/servicios/sitios-web/wordpress/${slug.replace('wordpress-', '')}/`
  }
  if (slug.includes('ecommerce') || slug.includes('tienda') || slug.includes('comprar')) {
    return `/servicios/ecommerce/${slug.replace('ecommerce-', '').replace('tienda-', '')}/`
  }
  if (slug.includes('local') || slug.includes('google') || slug.includes('maps')) {
    return `/servicios/seo/local/${slug.replace('local-', '')}/`
  }
  if (slug.includes('seo')) {
    return `/servicios/seo/${slug.replace('seo-', '')}/`
  }
  if (slug.includes('ia') || slug.includes('inteligencia') || slug.includes('ai')) {
    return `/servicios/ia/${slug.replace('ia-', '').replace('inteligencia-', '')}/`
  }
  
  return `/${slug}/`
}

function isUrlProtected(url: string): boolean {
  return PROTECTED_URLS.some(protectedUrl => 
    url === protectedUrl || url.startsWith(protectedUrl + '/')
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Publicado</span>
    case 'review':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">En revisión</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Borrador</span>
  }
}

export default function ContentPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [creatingPage, setCreatingPage] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clustersRes, pagesRes] = await Promise.all([
        supabaseClient.from('d_seo_admin_keyword_clusters').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('d_seo_admin_content_pages').select('*').order('updated_at', { ascending: false })
      ])

      setClusters(clustersRes.data || [])
      setContentPages(pagesRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPageForCluster = (clusterId: string): ContentPage | undefined => {
    return contentPages.find(p => p.cluster_id === clusterId)
  }

  const createContentPage = async (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId)
    if (!cluster) return

    const suggestedUrl = generateUrlSuggestion(cluster.name)
    const isProtected = isUrlProtected(suggestedUrl)

    if (isProtected) {
      alert('⚠️ Esta URL está protegida y no puede ser utilizada.\n\nPor favor, modifica el nombre del cluster para generar una URL válida.')
      return
    }

    setCreatingPage(true)
    try {
      const { error } = await supabaseClient
        .from('d_seo_admin_content_pages')
        .insert({
          cluster_id: clusterId,
          suggested_url: suggestedUrl,
          final_url: suggestedUrl,
          status: 'draft',
          content_data: {
            title: cluster.name,
            description: cluster.description,
            keywords: cluster.keyword_count
          }
        })

      if (error) {
        console.error('Error creating page:', error)
        alert('Error al crear la página')
      } else {
        await fetchData()
        alert('✅ Página de contenido creada')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCreatingPage(false)
    }
  }

  const updatePageStatus = async (pageId: string, newStatus: 'draft' | 'review' | 'published') => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString()
      }

      await supabaseClient
        .from('d_seo_admin_content_pages')
        .update(updateData)
        .eq('id', pageId)

      await fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const deletePage = async (pageId: string) => {
    if (!confirm('¿Eliminar esta página de contenido?')) return

    try {
      await supabaseClient
        .from('d_seo_admin_content_pages')
        .delete()
        .eq('id', pageId)

      await fetchData()
    } catch (err) {
      console.error('Error deleting page:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const clustersWithPage = clusters.map(cluster => ({
    ...cluster,
    page: getPageForCluster(cluster.id),
    suggestedUrl: generateUrlSuggestion(cluster.name),
    isProtected: isUrlProtected(generateUrlSuggestion(cluster.name))
  }))

  const stats = {
    total: clusters.length,
    withPage: clustersWithPage.filter(c => c.page).length,
    published: clustersWithPage.filter(c => c.page?.status === 'published').length,
    draft: clustersWithPage.filter(c => !c.page || c.page.status === 'draft').length,
    review: clustersWithPage.filter(c => c.page?.status === 'review').length
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contenido Web</h2>
        <p className="text-gray-600">
          Gestiona las páginas de contenido generadas a partir de clusters de keywords
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Clusters totales</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.withPage}</div>
          <div className="text-sm text-gray-500">Con página</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
          <div className="text-sm text-gray-500">En revisión</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          <div className="text-sm text-gray-500">Borrador</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-sm text-gray-500">Publicados</div>
        </div>
      </div>

      {/* Warning about protected URLs */}
      {clustersWithPage.some(c => c.isProtected) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">URLs Protegidas</h3>
              <p className="text-sm text-red-600 mt-1">
                Algunos clusters generan URLs que están protegidas y no pueden ser utilizadas. 
                Estas URLs están marcadas en rojo en la lista.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clusters List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL Sugerida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clustersWithPage.map((cluster) => (
              <tr key={cluster.id} className={cluster.isProtected && !cluster.page ? 'bg-red-50' : ''}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cluster.name}</div>
                      <div className="text-xs text-gray-500">{cluster.keyword_count} keywords</div>
                    </div>
                    {cluster.is_pillar_page && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Pillar</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {cluster.isProtected ? (
                      <span className="text-red-600 font-medium">
                        🔒 {cluster.suggestedUrl}
                      </span>
                    ) : (
                      <span className="text-gray-900">{cluster.suggestedUrl}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {cluster.page ? (
                    getStatusBadge(cluster.page.status)
                  ) : (
                    <span className="text-gray-400 text-xs">Sin página</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {cluster.page ? (
                    <span className="text-sm text-gray-500">v{cluster.page.version}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {cluster.isProtected && !cluster.page ? (
                    <span className="text-xs text-red-500">No disponible</span>
                  ) : cluster.page ? (
                    <div className="flex justify-end space-x-2">
                      {cluster.page.status === 'draft' && (
                        <button
                          onClick={() => updatePageStatus(cluster.page!.id, 'review')}
                          className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Enviar a revisión
                        </button>
                      )}
                      {cluster.page.status === 'review' && (
                        <>
                          <button
                            onClick={() => updatePageStatus(cluster.page!.id, 'draft')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Volver a borrador
                          </button>
                          <button
                            onClick={() => updatePageStatus(cluster.page!.id, 'published')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Publicar
                          </button>
                        </>
                      )}
                      {cluster.page.status === 'published' && (
                        <button
                          onClick={() => updatePageStatus(cluster.page!.id, 'draft')}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Despublicar
                        </button>
                      )}
                      <button
                        onClick={() => deletePage(cluster.page!.id)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => createContentPage(cluster.id)}
                      disabled={creatingPage}
                      className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {creatingPage ? 'Creando...' : 'Crear página'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clusters.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No hay clusters disponibles. Crea clusters desde la sección de Keywords.
            <Link href="/admin/keywords/clusters" className="text-indigo-600 hover:underline ml-1">
              Ir a Clusters
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
