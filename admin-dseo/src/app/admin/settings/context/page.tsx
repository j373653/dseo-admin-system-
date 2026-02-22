'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface CompanyContext {
  theme?: string
  services?: string[]
  target_companies?: string[]
  sitemap_urls?: string[]
  discard_topics?: string[]
}

export default function ContextSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [context, setContext] = useState<CompanyContext>({})
  const [message, setMessage] = useState('')

  const [theme, setTheme] = useState('')
  const [services, setServices] = useState('')
  const [targetCompanies, setTargetCompanies] = useState('')
  const [sitemapUrls, setSitemapUrls] = useState('')
  const [discardTopics, setDiscardTopics] = useState('')

  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    try {
      const res = await fetch('/api/seo/context')
      const data = await res.json()
      
      if (data.success && data.context) {
        setContext(data.context)
        setTheme(data.context.theme || '')
        setServices((data.context.services || []).join('\n'))
        setTargetCompanies((data.context.target_companies || []).join(', '))
        setSitemapUrls((data.context.sitemap_urls || []).join('\n'))
        setDiscardTopics((data.context.discard_topics || []).join(', '))
      }
    } catch (err) {
      console.error('Error loading context:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const updates = [
        { key: 'theme', value: theme },
        { key: 'services', value: services.split('\n').filter(s => s.trim()) },
        { key: 'target_companies', value: targetCompanies.split(',').map(t => t.trim()).filter(t => t) },
        { key: 'sitemap_urls', value: sitemapUrls.split('\n').filter(s => s.trim()) },
        { key: 'discard_topics', value: discardTopics.split(',').map(t => t.trim()).filter(t => t) }
      ]

      for (const update of updates) {
        await fetch('/api/seo/context', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        })
      }

      setMessage('✅ Contexto guardado correctamente')
      loadContext()
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const fetchSitemap = async () => {
    try {
      const res = await fetch('https://d-seo.es/sitemap.xml')
      const text = await res.text()
      const urls = text.match(/<loc>(.*?)<\/loc>/g)?.map(u => u.replace(/<\/?loc>/g, '')) || []
      setSitemapUrls(urls.join('\n'))
      setMessage('✅ Sitemap cargado desde d-seo.es')
    } catch (err) {
      setMessage('❌ Error al cargar sitemap')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">Cargando contexto...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Configuración del Contexto Empresarial</h1>
        <p className="text-gray-600">
          Define el contexto de tu empresa para que el sistema filtre y clasifique correctamente las keywords.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block font-medium mb-2">
            🎯 Tema Principal
            <span className="text-gray-500 font-normal ml-2">(Describe brevemente tu negocio)</span>
          </label>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full border rounded-lg p-3 h-20"
            placeholder="Desarrollo Web, SEO, Marketing Digital, Apps, IA"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block font-medium mb-2">
            🛠️ Servicios
            <span className="text-gray-500 font-normal ml-2">(Uno por línea)</span>
          </label>
          <textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            className="w-full border rounded-lg p-3 h-40"
            placeholder="Creación sitios web&#10;Tiendas online WooCommerce&#10;SEO&#10;Apps móviles"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block font-medium mb-2">
            👥 Clientes Objetivo
            <span className="text-gray-500 font-normal ml-2">(Separados por coma)</span>
          </label>
          <input
            type="text"
            value={targetCompanies}
            onChange={(e) => setTargetCompanies(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="PYMEs, Autónomos, Startups"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block font-medium">
              🗺️ URLs del Sitemap
              <span className="text-gray-500 font-normal ml-2">(Una por línea)</span>
            </label>
            <button
              onClick={fetchSitemap}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
            >
              📥 Cargar desde d-seo.es
            </button>
          </div>
          <textarea
            value={sitemapUrls}
            onChange={(e) => setSitemapUrls(e.target.value)}
            className="w-full border rounded-lg p-3 h-48 font-mono text-sm"
            placeholder="https://d-seo.es/&#10;https://d-seo.es/servicios/&#10;..."
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block font-medium mb-2">
            🚫 Temas a Descartar
            <span className="text-gray-500 font-normal ml-2">(Keywords que NO tienen que ver con tu negocio)</span>
          </label>
          <textarea
            value={discardTopics}
            onChange={(e) => setDiscardTopics(e.target.value)}
            className="w-full border rounded-lg p-3 h-24"
            placeholder="redes sociales, facebook, instagram, ads, google ads, hosting, dominios"
          />
          <p className="text-sm text-gray-500 mt-2">
            El sistema descartará automáticamente cualquier keyword que contenga estas palabras.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
          {message && (
            <span className="text-sm">{message}</span>
          )}
        </div>
      </div>
    </div>
  )
}
