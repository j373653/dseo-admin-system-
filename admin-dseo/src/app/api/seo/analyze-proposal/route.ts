import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function getAIConfig() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data } = await supabase
    .from('d_seo_admin_ai_config')
    .select('task, model, parameters, active')
  
  if (!data) return { silo: { model: 'gemini-2.5-pro', parameters: { maxTokens: 20000, temperature: 0.3 } } }
  
  const config: { [key: string]: any } = {}
  for (const item of data) {
    if (item.active !== false) {
      config[item.task] = {
        model: item.model,
        parameters: item.parameters || {}
      }
    }
  }
  return config
}

async function getCompanyContext() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data } = await supabase
    .from('d_seo_admin_company_context')
    .select('key, value')
  
  if (!data) return null
  
  const context: { [key: string]: any } = {}
  for (const item of data) {
    try {
      context[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value
    } catch (e) {
      context[item.key] = item.value
    }
  }
  return context
}

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface SiloProposal {
  name: string
  categories: {
    name: string
    pages: {
      main_keyword: string
      secondary_keywords: string[]
      type: 'service' | 'blog' | 'landing'
      is_pillar: boolean
      intent: 'informational' | 'transactional' | 'commercial'
    }[]
  }[]
}

async function analyzeSilosWithGemini(
  keywords: string[],
  apiKey: string,
  existingSilos: { name: string; categories: { name: string; pages: { main_keyword: string }[] }[] }[] = [],
  context: { theme?: string; services?: string[]; target_companies?: string[]; sitemap_urls?: string[]; discard_topics?: string[] } = {},
  aiModel: string = 'gemini-2.5-pro',
  aiParams: { maxTokens?: number; temperature?: number } = {},
  attempt: number = 1
): Promise<{ silos: SiloProposal[]; intentions: { [key: string]: string } }> {
  const MAX_RETRIES = 2
  
  const keywordList = keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')
  
  const existingSilosBlock = existingSilos.length > 0
    ? `EXISTING SILOS (para referencia - NO necesariamente usar estos):\n${
        existingSilos.map(s => 
          `Silo: ${s.name}\n` +
          s.categories.map(c => 
            `  Categoría: ${c.name}\n` +
            c.pages.map(p => `    Página: ${p.main_keyword}`).join('\n')
          ).join('\n')
        ).join('\n\n')
      }\n`
    : ''

  const theme = context.theme || 'Desarrollo Web, SEO, Marketing Digital, Apps, IA'
  const services = context.services?.join(', ') || 'Desarrollo web, WordPress, Ecommerce, SEO, IA, Apps'
  const targetCompanies = context.target_companies?.join(', ') || 'PYMEs, Autónomos, Startups'
  const sitemapUrls = context.sitemap_urls?.map(u => u.replace('https://d-seo.es', '')).join('\n') || ''
  const discardTopics = context.discard_topics?.join(', ') || 'redes sociales, ads, facebook, instagram, hosting, dominios'

  const companyContext = `CONTEXTO DE LA EMPRESA (d-seo.es):
- TEMA PRINCIPAL: ${theme}
- SERVICIOS: ${services}
- CLIENTES OBJETIVO: ${targetCompanies}
- TEMÁTICAS A DESCARTAR (NO trabajar con estas): ${discardTopics}

SITEMS ACTUALES DEL SITEMAP (evitar duplicar contenido existente):
${sitemapUrls || 'Sin sitemap disponible'}`

  const prompt = `${companyContext}

PALABRAS CLAVE A ANALIZAR - SOLO ESTAS, NO INVENTES O AGREGUES OTRAS:
${keywordList}

${existingSilosBlock}

Eres un experto en SEO. Analiza las keywords y devuelve una PROPUESTA DE ESTRUCTURA SILO (NO aplica nada, solo propone).

INSTRUCCIONES OBLIGATORIAS:
1. SOLO usa las keywords de la lista "PALABRAS CLAVE A ANALIZAR" - NO inventes, NO agregues otras keywords
2. Las secondary_keywords DEBEN ser keywords de la lista proporcionada
3. Descarta keywords que coincidan con: ${discardTopics}
4. NO propongas páginas que ya existen en el sitemap
5. Evita cannibalización (no repetir keywords similares)
6. Prioriza servicios que faltan en el sitemap

La estructura SILO propuesta debe ser:
- SILO (Tema principal): Grupo de categoría de nivel superior
- CATEGORÍA: Sub-tema dentro del silo
- PÁGINA: Página de contenido específica

Para CADA página, especifica:
- main_keyword: Keyword principal (DEBE ser una de las keywords proporcionadas)
- secondary_keywords: Keywords secundarias (SOLO de la lista proporcionada)
- type: "service" (página de servicio), "blog" (artículo), "landing" (página de aterrizaje)
- is_pillar: true si es la página más importante de la categoría
- intent: "informational" (busca información), "transactional" (quiere comprar/contratar), "commercial" (compara/decide)

IMPORTANTE:
- Agrupa las keywords de forma lógica
- Maximiza 5-7 silos (no cientos)
- Cada categoría 1-3 páginas máximo
- keywords "transactional" → tipo "service" o "landing"
- keywords "informational" → tipo "blog"
- is_pillar = true solo para la página más importante de cada categoría
- keywords muy similares (duplicados semánticos) -> agrupa en la misma página
- NO INVENTES keywords - usa EXACTAMENTE las de la lista

Devuelve EXACTAMENTE este JSON:

{
  "silos": [
    {
      "name": "Desarrollo Web",
      "categories": [
        {
          "name": "WordPress",
          "pages": [
            {
              "main_keyword": "desarrollo wordpress profesional",
              "secondary_keywords": ["wordpress developer", "programador wp", "crear web wordpress"],
              "type": "service",
              "is_pillar": true,
              "intent": "transactional"
            },
            {
              "main_keyword": "cuánto cuesta una web wordpress",
              "secondary_keywords": ["precio web wordpress", "presupuesto wordpress"],
              "type": "blog",
              "is_pillar": false,
              "intent": "commercial"
            }
          ]
        }
      ]
    }
  ],
  "intentions": {
    "keyword_exacta": "informational|transactional|commercial"
  }
}`

  try {
    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: aiParams.temperature ?? 0.3,
        maxOutputTokens: aiParams.maxTokens ?? 20000,
        responseMimeType: 'application/json'
      }
    }

    const response = await fetch(
      `${API_URL}/${aiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Respuesta inválida de Gemini')
    }

    const content = data.candidates[0].content.parts[0].text

    let parsed: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se encontró JSON en la respuesta')
      }
    } catch (parseError: any) {
      console.error('JSON Parse error. Content:', content.slice(0, 1000))
      throw new Error('Error parseando JSON de Gemini: ' + content.slice(0, 200))
    }

    if (!parsed.silos) {
      throw new Error('Respuesta sin estructura de silos')
    }

    return {
      silos: parsed.silos || [],
      intentions: parsed.intentions || {}
    }

  } catch (error: any) {
    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying SILO analysis (attempt ${attempt + 1})...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return analyzeSilosWithGemini(keywords, apiKey, existingSilos, context, aiModel, aiParams, attempt + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const body = await request.json()
    const { keywordIds, useExistingSilos } = body
    
    console.log('=== API DEBUG ===')
    console.log('Full body:', body)
    console.log('keywordIds type:', typeof keywordIds)
    console.log('keywordIds isArray:', Array.isArray(keywordIds))
    console.log('keywordIds received:', keywordIds?.length, keywordIds)
    console.log('useExistingSilos:', useExistingSilos)
    
    const apiKey = process.env.GOOGLE_AI_API_KEY
    console.log('GOOGLE_AI_API_KEY exists:', !!apiKey)
    
    if (!apiKey) {
      console.log('ERROR: No API key')
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    let keywords: { id: string; keyword: string }[] = []
    
    if (keywordIds && keywordIds.length > 0) {
      console.log('Fetching keywords with IDs...')
      console.log('First 3 keywordIds:', keywordIds.slice(0, 3))
      console.log('keywordIds type:', typeof keywordIds[0])
      
      // Fetch in batches if too many IDs
      let allKeywords: { id: string; keyword: string }[] = []
      const BATCH_SIZE = 100
      
      for (let i = 0; i < keywordIds.length; i += BATCH_SIZE) {
        const batch = keywordIds.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from('d_seo_admin_raw_keywords')
          .select('id, keyword')
          .in('id', batch)
        
        if (error) {
          console.log('Batch query error:', error)
        }
        if (data) {
          allKeywords = [...allKeywords, ...data]
        }
      }
      
      console.log('Query result - total data:', allKeywords.length)
      if (allKeywords.length > 0) {
        console.log('Sample returned:', allKeywords.slice(0, 2))
      }
      keywords = allKeywords
    } else {
      console.log('Fetching all pending keywords...')
      const { data, error } = await supabase
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .eq('status', 'pending')
        .limit(500)
      
      console.log('Query result - data:', data?.length, 'error:', error)
      keywords = data || []
    }

    console.log('Keywords found:', keywords.length)
    
    if (keywords.length === 0) {
      console.log('ERROR: No keywords found - returning detailed error')
      return NextResponse.json({ 
        error: 'No hay keywords pendientes para analizar',
        debug: {
          keywordIdsReceived: keywordIds?.length || 0,
          useExistingSilos
        }
      }, { status: 400 })
    }

    const existingSilos: { name: string; categories: { name: string; pages: { main_keyword: string }[] }[] }[] = []
    
    const context = await getCompanyContext()
    console.log('Company context loaded:', context ? 'yes' : 'no')
    
    if (useExistingSilos) {
      const { data: silos } = await supabase
        .from('d_seo_admin_silos')
        .select('id, name')

      if (silos && silos.length > 0) {
        for (const silo of silos) {
          const { data: cats } = await supabase
            .from('d_seo_admin_categories')
            .select('id, name')
            .eq('silo_id', silo.id)
          
          const categories = []
          if (cats && cats.length > 0) {
            for (const cat of cats) {
              const { data: pages } = await supabase
                .from('d_seo_admin_pages')
                .select('main_keyword')
                .eq('category_id', cat.id)
              
              categories.push({
                name: cat.name,
                pages: pages || []
              })
            }
          }
          existingSilos.push({
            name: silo.name,
            categories
          })
        }
      }
    }

    const keywordTexts = keywords.slice(0, 150).map(k => k.keyword)
    
    const aiConfig = await getAIConfig()
    const siloConfig = aiConfig?.silo || { model: 'gemini-2.5-pro', parameters: { maxTokens: 20000, temperature: 0.3 } }
    const aiModel = siloConfig.model
    const aiParams = siloConfig.parameters || {}
    
    console.log(`Analyzing ${keywordTexts.length} keywords for SILO proposal with model: ${aiModel}`)
    
    const proposal = await analyzeSilosWithGemini(keywordTexts, apiKey, existingSilos, context || {}, aiModel, aiParams)

    return NextResponse.json({
      success: true,
      keywordCount: keywords.length,
      keywordsAnalyzed: keywordTexts.length,
      keywords: keywords.slice(0, 150).map(k => ({ id: k.id, keyword: k.keyword })),
      proposal: proposal.silos,
      intentions: proposal.intentions,
      existingSilosUsed: useExistingSilos && existingSilos.length > 0,
      existingSilosCount: existingSilos.length,
      contextUsed: !!context
    })

  } catch (error: any) {
    console.error('Error in analyze-proposal:', error)
    return NextResponse.json({ 
      error: error.message || 'Error analyzing keywords',
      details: error.toString()
    }, { status: 500 })
  }
}
