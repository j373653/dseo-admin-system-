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
): Promise<{ silos: SiloProposal[]; intentions: { [key: string]: string }; validationErrors: string[] }> {
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

  const prompt = `### ROL: Senior SEO Strategist & Information Architect
Actúa como un consultor SEO experto con 15 años de experiencia en arquitectura de información y jerarquía de contenidos. Tu especialidad es la creación de estructuras SILO que maximizan el traspaso de autoridad y evitan la canibalización.

### CONTEXTO Y OBJETIVO
El objetivo es diseñar una PROPUESTA DE ESTRUCTURA SILO lógica y optimizada utilizando ÚNICAMENTE una lista de palabras clave proporcionada.

### DATOS DE ENTRADA
1. PALABRAS CLAVE A ANALIZAR (SOLO estas, NO inventes):
${keywordList}

2. ESTRUCTURA ACTUAL / SITEMAP:
${existingSilosBlock || 'Sin estructura existente'}

3. TEMAS A DESCARTAR: ${discardTopics}

### REGLAS CRÍTICAS DE CUMPLIMIENTO
1. PROHIBICIÓN DE INVENCIÓN: No puedes añadir, modificar ni inventar ninguna keyword. Si no está en la lista "PALABRAS CLAVE A ANALIZAR", NO EXISTE.
2. Las secondary_keywords DEBEN ser keywords de la lista proporcionada
3. FILTRO NEGATIVO: Descarta inmediatamente cualquier keyword que coincida con: ${discardTopics}
4. ANTI-CANIBALIZACIÓN: No proposes páginas que ya existen en el sitemap actual
5. PRIORIZACIÓN: Da preferencia a keywords que representen servicios o categorías que NO estén en el sitemap actual
6. Cada página propuesta debe tener una main_keyword única de la lista proporcionada

### FASES DE EJECUCIÓN
1. Fase de Limpieza: Filtra la lista original eliminando temas descartados y keywords del sitemap
2. Fase de Clustering: Agrupa las keywords restantes por intención de búsqueda y temática
3. Fase de Arquitectura: Define qué keywords funcionarán como "Páginas Pilar" y cuáles como "Páginas de Soporte"
4. Fase de Verificación: Asegúrate de que ninguna keyword secundaria se repita en diferentes páginas

### ESTRUCTURA SILO
- SILO (Tema principal): Grupo de categoría de nivel superior
- CATEGORÍA: Sub-tema dentro del silo
- PÁGINA: Página de contenido específica

Para CADA página, especifica:
- main_keyword: Keyword principal (OBLIGATORIO: debe estar en la lista de PALABRAS CLAVE A ANALIZAR)
- secondary_keywords: Keywords secundarias (OBLIGATORIO: todas de la lista proporcionada, separadas por coma)
- type: "service" (servicio), "blog" (artículo), "landing" (aterrizaje)
- is_pillar: true si es la página más importante de la categoría
- intent: "informational" (información), "transactional" (compra/contratar), "commercial" (compara)

### REGLAS FINALES
- NO INVENTES keywords - usa EXACTAMENTE las de la lista
- Maximiza 5-7 silos
- Cada categoría: 1-3 páginas máximo
- keywords "transactional" → tipo "service" o "landing"
- keywords "informational" → tipo "blog"
- keywords muy similares → agrupa en la misma página

### FORMATO DE SALIDA JSON:
${`{
  "silos": [
    {
      "name": "Desarrollo Web",
      "categories": [
        {
          "name": "WordPress",
          "pages": [
            {
              "main_keyword": "desarrollo wordpress profesional",
              "secondary_keywords": ["wordpress developer", "programador wp"],
              "type": "service",
              "is_pillar": true,
              "intent": "transactional"
            }
          ]
        }
      ]
    }
  ],
  "intentions": {}
}`}
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

    // Validación post-IA: verificar que las keywords propuestas existen en la lista original
    const keywordSet = new Set(keywords.map(k => k.toLowerCase().trim()))
    const validationErrors: string[] = []
    
    // Función para validar y limpiar keywords
    const validateKeywords = (silos: SiloProposal[]): SiloProposal[] => {
      return silos.map(silo => ({
        ...silo,
        categories: silo.categories.map(cat => ({
          ...cat,
          pages: cat.pages.map(page => {
            // Validar main_keyword
            const mainKwLower = page.main_keyword.toLowerCase().trim()
            if (!keywordSet.has(mainKwLower)) {
              validationErrors.push(`Main keyword "${page.main_keyword}" no está en la lista original`)
            }
            
            // Normalizar secondary_keywords a array
            let secondaryArr: string[] = []
            if (Array.isArray(page.secondary_keywords)) {
              secondaryArr = page.secondary_keywords
            } else if (typeof page.secondary_keywords === 'string') {
              secondaryArr = (page.secondary_keywords as string).split(',').map(k => k.trim())
            }
            
            // Validar secondary_keywords - filtrar las que no existen
            const validSecondary = secondaryArr.filter(
              kw => keywordSet.has(kw.toLowerCase().trim())
            )
            
            // Si hay secondary keywords que no existen, registrarlas
            secondaryArr.forEach(kw => {
              if (!keywordSet.has(kw.toLowerCase().trim())) {
                validationErrors.push(`Secondary keyword "${kw}" no está en la lista original`)
              }
            })
            
            return {
              ...page,
              secondary_keywords: validSecondary
            }
          }).filter(page => {
            const secondary = Array.isArray(page.secondary_keywords) ? page.secondary_keywords : []
            return secondary.length > 0 || keywordSet.has(page.main_keyword.toLowerCase().trim())
          })
        })).filter(cat => {
          const pages = Array.isArray(cat.pages) ? cat.pages : []
          return pages.length > 0
        })
      })).filter(silo => {
        const categories = Array.isArray(silo.categories) ? silo.categories : []
        return categories.length > 0
      })
    }

    const validatedSilos = validateKeywords(parsed.silos)
    
    console.log('Validación de keywords:', validationErrors.length > 0 ? validationErrors.join(', ') : 'OK')

    return {
      silos: validatedSilos,
      intentions: parsed.intentions || {},
      validationErrors
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
      validationErrors: proposal.validationErrors,
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
