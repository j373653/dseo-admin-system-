import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface ClusterData {
  id: string
  name: string
  entity?: string
  intent?: string
  keywords: string[]
}

interface UrlsFromClustersRequest {
  clusters?: any[]
  existingStructure?: any
  model?: string
  provider?: string
  apiKeyEnvVar?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: UrlsFromClustersRequest = await request.json()
    const { clusters: clustersFromClient, existingStructure, model, provider, apiKeyEnvVar } = body

    if (!clustersFromClient || clustersFromClient.length === 0) {
      return NextResponse.json({ error: 'Se requieren clusters' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Usar clusters del cliente (ya contienen keywords del análisis)
    const clustersWithKeywords: ClusterData[] = clustersFromClient.map((cluster: any) => ({
      id: cluster.id,
      name: cluster.name,
      entity: cluster.name,
      intent: cluster.intent || 'informational',
      keywords: cluster.keywords || []
    }))

    // 2. Obtener estructura existente (URLs ya creadas)
    let existingUrls: string[] = []
    if (existingStructure) {
      existingUrls = extractExistingSlugs(existingStructure)
    } else {
      // Consultar páginas existentes en BD
      const { data: pages } = await supabase
        .from('d_seo_admin_pages')
        .select('slug')
      existingUrls = pages?.map(p => p.slug) || []
    }

    // 3. Seleccionar modelo IA
    let aiModel = model || await getDefaultModel('silo')
    let apiKey = await getApiKey(aiModel, provider, apiKeyEnvVar)

    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    // 4. Construir prompt para IA
    const prompt = buildUrlsPrompt(clustersWithKeywords, existingUrls)

    // 5. Llamar a IA (Gemini)
    const aiResponse = await callGemini(prompt, apiKey, aiModel)
    const parsed = parseAIResponse(aiResponse)

    // 6. Devolver estructura
    return NextResponse.json({ 
      success: true, 
      urls: parsed.urls,
      clusters: clustersWithKeywords,
      validation: parsed.validation 
    })

  } catch (error: any) {
    console.error('Error generating URLs from clusters:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

function extractExistingSlugs(structure: any): string[] {
  const slugs: string[] = []
  function traverse(silos: any[]) {
    for (const silo of silos) {
      for (const cat of silo.categories || []) {
        for (const page of cat.pages || []) {
          if (page.slug) slugs.push(page.slug)
        }
      }
    }
  }
  traverse(structure.silos || structure)
  return slugs
}

async function getDefaultModel(task: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('d_seo_admin_ai_task_config')
    .select('model_id')
    .eq('task', task)
    .eq('is_default', true)
    .single()
  return data?.model_id || 'gemini-2.5-flash'
}

async function getApiKey(model: string, provider?: string, apiKeyEnvVar?: string): Promise<string> {
  if (apiKeyEnvVar && process.env[apiKeyEnvVar]) {
    return process.env[apiKeyEnvVar]
  }

  const providerName = provider?.toLowerCase() || ''
  if (providerName.includes('google')) {
    return process.env.GEMINI_MAIN_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
  } else if (providerName.includes('openrouter')) {
    return process.env.OPENROUTER_API_KEY || ''
  }

  // Default: Google
  return process.env.GEMINI_MAIN_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
}

function buildUrlsPrompt(clusters: ClusterData[], existingUrls: string[]): string {
  const clustersInfo = clusters.map((cluster: ClusterData, idx: number) =>
    `CLUSTER ${idx + 1}:
  Nombre: ${cluster.name}
  Entidad: ${cluster.entity}
  Intención: ${cluster.intent}
  Keywords: ${cluster.keywords.join(', ')}`
  ).join('\n\n')

  return `Eres un experto en arquitectura SEO. Tu misión es convertir clusters de keywords en una estructura de URLs con páginas pilares y de soporte.

CLUSTERS:
${clustersInfo}

URLs EXISTENTES (NO crear duplicados):
${existingUrls.length > 0 ? existingUrls.join('\n') : 'Ninguna'}

INSTRUCCIONES:
1. Para CADA cluster, crear al menos UNA página PILLAR (la más importante).
2. El resto de keywords del cluster serán páginas SUPPORT (long-tail) que enlazan al pillar.
3. Generar slugs SEO-friendly basados en la keyword principal.
   - Formato: /categoria/subcategoria/keyword-slug
   - Ej: /desarrollo-web/wordpress/crear-pagina-web
4. Asignar:
   - main_keyword: la keyword principal de la página
   - secondary_keywords: resto de keywords del cluster que no son main
   - cluster_type: "pillar" o "support"
   - intent: Debes asignar el intent del cluster (informational, commercial_investigation, transactional, navigational)
   - entity: entidad principal del cluster
   - content_difficulty: short (<500w), medium (500-1500w), long (1500-3000w), guide (>3000w)
   - internal_linking: array de slugs que esta página debe enlazar (al pillar del cluster y a otros relevantes)
5. Agrupar páginas por PILARES (usar los 4 pilares de d-seo.es):
   - Desarrollo Web & E-commerce
   - Aplicaciones & Software
   - IA & Automatizaciones
   - SEO & Marketing Digital
6. Cada pilar puede tener categorías (subdivisiones temáticas).
7. NO duplicar slugs existentes. Si un slug ya existe, modify suffix (ej: /pagina-web → /pagina-web-2).

SALIDA JSON (estricto):
{
  "urls": [
    {
      "pilar": "Desarrollo Web & E-commerce",
      "categoria": "WordPress",
      "slug": "/desarrollo-web/wordpress/crear-pagina-web",
      "main_keyword": "crear pagina web",
      "secondary_keywords": ["hacer pagina web", "diseño web"],
      "cluster_type": "pillar",
      "intent": "transactional",
      "entity": "Página Web",
      "content_difficulty": "medium",
      "internal_linking": ["/ia/automatizaciones/chatbot-ia"]
    },
    {
      "pilar": "Desarrollo Web & E-commerce",
      "categoria": "WordPress",
      "slug": "/desarrollo-web/wordpress/crear-pagina-web-wordpress",
      "main_keyword": "crear pagina web wordpress",
      "secondary_keywords": ["wordpress madrid"],
      "cluster_type": "support",
      "intent": "transactional",
      "entity": "WordPress",
      "content_difficulty": "short",
      "internal_linking": ["/desarrollo-web/wordpress/crear-pagina-web"]
    }
  ],
  "validation": {
    "duplicate_slugs": [],
    "clusters_without_pages": [],
    "warnings": []
  }
}

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE el JSON, sin texto adicional.
- Asegura que todos los clusters tengan al menos una página PILLAR.
- Usa la entidad para categorizar correctamente.
- Respeta las URLs existentes.
- Genera slugs únicos y legibles.`
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const isOpenRouter = model.includes('openai/') || model.includes('openrouter/') || model.includes('/') || model.includes(':free')
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'
  const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

  if (isOpenRouter) {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://admin.d-seo.es',
        'X-Title': 'D-SEO Admin'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 12000,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })
    const data = await response.json()
    return data.choices[0].message.content
  } else {
    const generationConfig: any = {
      temperature: 0.2,
      maxOutputTokens: 12000,
      responseMimeType: 'application/json'
    }
    if (model.includes('flash')) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 }
    }

    const response = await fetch(
      `${GOOGLE_API_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig
        })
      }
    )
    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }
}

function parseAIResponse(content: string): { urls: any[], validation: any } {
  try {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = match ? match[1].trim() : content.trim()
    const parsed = JSON.parse(jsonStr)
    return {
      urls: parsed.urls || [],
      validation: parsed.validation || {}
    }
  } catch (error) {
    console.error('Parse error:', error, 'Content:', content.slice(0, 500))
    return { urls: [], validation: { error: 'Invalid JSON from AI' } }
  }
}
