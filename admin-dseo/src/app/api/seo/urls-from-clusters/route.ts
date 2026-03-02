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

═══════════════════════════════════════════════════════════════════════════════
NORMAS OBLIGATORIAS DE DISTRIBUCIÓN DE KEYWORDS (SEO ÓPTIMO - Topic Authority)
═══════════════════════════════════════════════════════════════════════════════

🎯 REGLAS DE DISTRIBUCIÓN (ESTRICTO - NO INFRINGIR):

1. CADA keyword del cluster DEBE ser main_keyword en EXACTAMENTE UNA página.
   - Una keyword NO puede ser main_keyword en 2 páginas diferentes.
   - Esto causa CANIBALIZACIÓN y penaliza el SEO.

2. PÁGINA PILLAR (1 por cluster):
   - main_keyword: La keyword de MAYOR volumen/importancia del cluster (la más genérica/transaccional)
   - secondary_keywords: SOLO 2-3 keywords secundarias más cercanas semánticamente
   - content_difficulty: "guide" (>3000 palabras)
   - Es la página hub que enlaza a todos los supports

3. PÁGINAS DE SOPORTE (tantas como keywords secundarias restantes):
   - Una página de soporte por cada keyword SECUNDARIA restante del cluster
   - main_keyword: cada keyword secundaria (una página por cada una)
   - secondary_keywords: [] (vacío) o MÁXIMO 1 keyword relacionada que NO sea main en otra página
   - content_difficulty: "short" (<500 palabras) o "medium" (500-1500 palabras)

4. EJEMPLO CORRECTO (4 keywords en cluster):
   Cluster: ["agencia seo barcelona", "seo barcelona", "posicionamiento web barcelona", "auditoría seo barcelona"]
   
   PILLAR:
     main_keyword: "agencia seo barcelona"
     secondary_keywords: ["seo barcelona", "posicionamiento web barcelona"]
     cluster_type: "pillar"
     content_difficulty: "guide"
   
   SUPPORT 1:
     main_keyword: "seo barcelona"
     secondary_keywords: []
     cluster_type: "support"
   
   SUPPORT 2:
     main_keyword: "posicionamiento web barcelona"
     secondary_keywords: []
     cluster_type: "support"
   
   SUPPORT 3:
     main_keyword: "auditoría seo barcelona"
     secondary_keywords: []
     cluster_type: "support"

5. PROHIBIDO (CAUSARÁ CANIBALIZACIÓN):
   ❌ Poner TODAS las secundarias en una sola support page
   ❌ Que una keyword aparezca como main en 2+ páginas
   ❌ Que el pillar tenga 10 secondary_keywords
   ❌ Que los supports tengan muchas secondary_keywords

═══════════════════════════════════════════════════════════════════════════════

INSTRUCCIONES GENERALES:
1. Generar slugs SEO-friendly basados en la main_keyword de cada página.
   - Formato: /categoria/subcategoria/keyword-slug
   - Ej: /servicios/seo/agencia-seo-barcelona
2. Asignar:
   - pilar: Uno de los 4 pilares (ver abajo)
   - categoria: Subdivisión temática
   - slug: URL friendly
   - main_keyword: Keyword principal de ESTA página
   - secondary_keywords: Según reglas de distribución de arriba
   - cluster_type: "pillar" o "support"
   - intent: Del cluster (informational, commercial_investigation, transactional, navigational)
   - entity: Entidad principal del cluster
   - content_difficulty: "short", "medium", "long", o "guide"
   - internal_linking: Array de slugs a enlazar (supports → pillar, y pillar → supports)
3. Agrupar por PILARES de d-seo.es:
   - Desarrollo Web & E-commerce
   - Aplicaciones & Software
   - IA & Automatizaciones
   - SEO & Marketing Digital
4. NO duplicar slugs existentes. Si existe, añadir sufijo (-2, -3...).

═══════════════════════════════════════════════════════════════════════════════
VALIDACIÓN DE DATOS (IMPORTANTE - DETECTAR PROBLEMAS):
═══════════════════════════════════════════════════════════════════════════════

Antes de generar, verifica:

1. DUPLICADOS NORMALIZADOS:
   - Si encuentras keywords que son idénticas al normalizar (quitar tildes, espacios, mayúsculas)
     Ej: "diseño de páginas" vs "diseño de paginas"
   - Debes-agruparlas y Reportarlas en validation.warnings
   - Usa solo UNA representación (la más limpia) en las páginas

2. DISTRIBUCIÓN CORRECTA:
   - CADA keyword del cluster debe aparecer como main_keyword en exactamente UNA página
   - Verifica que no falta ninguna keyword
   - Verifica que no hay duplicados como main

Si encuentras problemas, inclúyelos en validation.warnings y genera URLs solo con las keywords válidas.

═══════════════════════════════════════════════════════════════════════════════

SALIDA JSON (estricto):
{
  "urls": [
    {
      "pilar": "Desarrollo Web & E-commerce",
      "categoria": "SEO",
      "slug": "/servicios/seo/agencia-seo-barcelona",
      "main_keyword": "agencia seo barcelona",
      "secondary_keywords": ["seo barcelona", "posicionamiento web barcelona"],
      "cluster_type": "pillar",
      "intent": "transactional",
      "entity": "Agencia SEO",
      "content_difficulty": "guide",
      "internal_linking": ["/servicios/seo/seo-barcelona", "/servicios/seo/posicionamiento-web-barcelona"]
    },
    {
      "pilar": "Desarrollo Web & E-commerce",
      "categoria": "SEO",
      "slug": "/servicios/seo/seo-barcelona",
      "main_keyword": "seo barcelona",
      "secondary_keywords": [],
      "cluster_type": "support",
      "intent": "commercial_investigation",
      "entity": "SEO",
      "content_difficulty": "medium",
      "internal_linking": ["/servicios/seo/agencia-seo-barcelona"]
    }
  ],
   "validation": {
     "duplicate_slugs": [],
     "duplicate_keywords": [], // Lista de keywords duplicadas (normalizadas) encontradas
     "clusters_without_pages": [],
     "warnings": [] // Advertencias adicionales
   }
 

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE el JSON, sin texto adicional.
- CADA keyword del cluster debe ser main_keyword en EXACTAMENTE una página.
- Pillar: main + 2-3 secundarias. Support: main + 0-1 secundarias.
- NO causes canibalización.
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
