import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

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
      main_keyword_id: string
      main_keyword?: string
      secondary_keywords_ids: string[]
      secondary_keywords?: string[]
      type: 'service' | 'blog' | 'landing'
      is_pillar: boolean
      intent: 'informational' | 'transactional' | 'commercial'
    }[]
  }[]
}

interface SiloForPrompt {
  name: string
  categories: {
    name: string
    pages: {
      main_keyword: string
    }[]
  }[]
}

async function analyzeSilosWithGemini(
  keywords: { id: string; keyword: string }[],
  apiKey: string,
  existingSilos: SiloForPrompt[] = [],
  context: { theme?: string; services?: string[]; target_companies?: string[]; sitemap_urls?: string[]; discard_topics?: string[] } = {},
  aiModel: string = 'gemini-2.5-pro',
  aiParams: { maxTokens?: number; temperature?: number } = {},
  attempt: number = 1
): Promise<{ silos: SiloProposal[]; intentions: { [key: string]: string }; validationErrors: string[] }> {
  const MAX_RETRIES = 2
  
  // Create a map for quick ID lookup
  const keywordMap = new Map(keywords.map(k => [k.keyword.toLowerCase().trim(), k.id]))
  
  // Format keywords with IDs for the prompt
  const keywordList = keywords.map((k, i) => `ID:${k.id} → "${k.keyword}"`).join('\n')
  
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

SITEMAP ACTUAL DEL SITIO WEB (evitar duplicar contenido existente):
${sitemapUrls || 'Sin sitemap disponible'}`

  // Lista de silos válidos predefinidos (estructura consolidada)
  const validSilos = `SILOS VÁLIDOS Y OBLIGATORIOS (usar estos silos existentes):
- Desarrollo Web (incluye: WordPress, E-commerce, Apps, Diseño Web, Blog, Digitalización)
- SEO (Posicionamiento Web) (incluye: SEO, Analítica, Auditorías)
- Inteligencia Artificial (incluye: IA, Automatización, Chatbots)
- Marketing Digital (incluye: Estrategia, Contenido, Redes)
- Textos Legales Web (incluye: RGPD, Políticas, Legal)

INSTRUCCIONES DE SILOS:
- USA los silos de arriba EXACTAMENTE como están escritos
- NO crees nuevos silos - usa uno de los 5 silos listados
- Si una keyword no encaja → crear categoría DENTRO del silo más relacionado
- Solo crear categoría nueva si no existe ninguna apropiada`

  const prompt = `### ROL: Senior SEO Strategist & Information Architect
Actúa como un consultor SEO experto con 15 años de experiencia en arquitectura de información y jerarquía de contenidos. Tu especialidad es la creación de estructuras SILO que maximizan el traspaso de autoridad y evitan la canibalización.

### CONTEXTO Y OBJETIVO
El objetivo es diseñar una PROPUESTA DE ESTRUCTURA SILO lógica y optimizada utilizando ÚNICAMENTE una lista de palabras clave proporcionada.

### DATOS DE ENTRADA
1. PALABRAS CLAVE A ANALIZAR (SOLO estas, NO inventes):
${keywordList}

2. ESTRUCTURA ACTUAL (para referencia):
${existingSilosBlock || 'Sin estructura existente'}

3. TEMAS A DESCARTAR: ${discardTopics}

### REGLAS CRÍTICAS DE CUMPLIMIENTO
1. PROHIBICIÓN DE INVENCIÓN: No puedes añadir, modificar ni inventar ninguna keyword. Si no está en la lista "PALABRAS CLAVE A ANALIZAR", NO EXISTE.
2. Las secondary_keywords DEBEN ser keywords de la lista proporcionada
3. FILTRO NEGATIVO: Descarta inmediatamente cualquier keyword que coincida con: ${discardTopics}
4. ANTI-CANIBALIZACIÓN: No proposes páginas que ya existen en el sitemap actual
5. Cada página propuesta debe tener una main_keyword única de la lista proporcionada
6. USA LOS 5 SILOS DEFINIDOS - NO creas silos nuevos

### FASES DE EJECUCIÓN
1. Fase de Limpieza: Filtra la lista original eliminando temas descartados
2. Fase de Clustering: Agrupa las keywords por intención de búsqueda y temática
3. Fase de Arquitectura: Asigna cada keyword a un SILO existente y crea categorías dentro si es necesario

### ESTRUCTURA SILO - USAR SOLO LOS 5 SILOS DEFINIDOS
${validSilos}

Para CADA página, especifica:
- main_keyword: Keyword principal (OBLIGATORIO: debe estar en la lista de PALABRAS CLAVE A ANALIZAR)
- secondary_keywords: Keywords secundarias relacionadas (de la lista proporcionada)
- type: "service" (servicio), "blog" (artículo), "landing" (aterrizaje)
- is_pillar: true si es la página más importante de la categoría
- intent: "informational" (información), "transactional" (compra/contratar), "commercial" (compara)

### REGLAS FINALES
- NO INVENTES keywords - usa EXACTAMENTE las de la lista
- NO CREES NUEVOS SILOS - usa solo los 5 silos definidos arriba
- keywords "transactional" → tipo "service" o "landing"
- keywords "informational" → tipo "blog"
- keywords muy similares → agrupa en la misma página
- CADA keyword de la lista debe aparecer al menos una vez (como main o secondary)

### FORMATO DE SALIDA JSON:
- Para cada página, incluye TANTO el ID como el texto de la keyword (para validación cruzada)
- Formato: "main_keyword_id": "uuid-aqui", "main_keyword": "texto de la keyword"
- secondary_keywords_ids: array de IDs, secondary_keywords: array de textos
${`{
  "silos": [
    {
      "name": "Desarrollo Web",
      "categories": [
        {
          "name": "WordPress",
          "pages": [
            {
              "main_keyword_id": "uuid-aqui",
              "main_keyword": "desarrollo wordpress madrid",
              "secondary_keywords_ids": ["uuid-1", "uuid-2"],
              "secondary_keywords": ["keyword sec 1", "keyword sec 2"],
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

  // Configurar thinking solo para Flash (Pro no soporta disable)
  const generationConfig: any = {
    temperature: aiParams.temperature ?? 0.3,
    maxOutputTokens: aiParams.maxTokens ?? 20000,
    responseMimeType: 'application/json'
  }
  
  // Solo Flash puede usar thinking_budget: 0
  if (aiModel.includes('flash')) {
    generationConfig.thinkingConfig = {
      thinkingBudget: 0
    }
  }

  // Determinar si usar OpenRouter o Google
  // OpenRouter models: openai/*, openrouter/*, provider/model:free, etc.
  const isOpenRouter = aiModel.includes('openai/') || aiModel.includes('openrouter/') || aiModel.includes('/') || aiModel.includes(':free')
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  
  let response
  let content
  
  if (isOpenRouter) {
    // OpenRouter API - modelos ya tienen prefijo como "openai/", "arcee-ai/", etc.
    const modelName = aiModel
    
    const requestBody = {
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: aiParams.maxTokens ?? 20000,
      temperature: aiParams.temperature ?? 0.3,
      response_format: { type: 'json_object' }
    }

    response = await fetch(
      `${OPENROUTER_API_URL}/chat/completions`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://admin.d-seo.es',
          'X-Title': 'D-SEO Admin'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(300000)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Respuesta inválida de OpenRouter')
    }

    content = data.choices[0].message.content
  } else {
    // Google Gemini API (original)
    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    }

    response = await fetch(
      `${GOOGLE_API_URL}/${aiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(300000)
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

    content = data.candidates[0].content.parts[0].text
  }

    // Función robusta para extraer JSON
    function extractJSON(text: string): any {
      // Método 1: Buscar bloques JSON completos con ```
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim())
        } catch (e) { /* continue */ }
      }
      
      // Método 2: Buscar desde primer { hasta último }
      const braceMatch = text.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0])
        } catch (e) { /* continue */ }
      }
      
      // Método 3: Intentar reparar JSON truncado de forma más robusta
      const partialMatch = text.match(/\{[\s\S]+/)
      if (partialMatch) {
        let fixed = partialMatch[0]
        
        // Cerrar corchetes abiertos
        const bracketOpens = (fixed.match(/\[/g) || []).length
        const bracketCloses = (fixed.match(/\]/g) || []).length
        if (bracketOpens > bracketCloses) {
          fixed += ']'.repeat(bracketOpens - bracketCloses)
        }
        
        // Cerrar llaves abiertas
        const braceOpens = (fixed.match(/\{/g) || []).length
        const braceCloses = (fixed.match(/\}/g) || []).length
        if (braceOpens > braceCloses) {
          fixed += '}'.repeat(braceOpens - braceCloses)
        }
        
        // Eliminar comillas abiertas al final
        fixed = fixed.replace(/,\s*$/, '')
        fixed = fixed.replace(/"$/, '')
        
        try {
          return JSON.parse(fixed)
        } catch (e) {
          // Último intento: buscar solo la parte válida del JSON
          const validStart = fixed.indexOf('{"silos"')
          if (validStart >= 0) {
            const partialJson = fixed.substring(validStart)
            try {
              return JSON.parse(partialJson)
            } catch (e2) { /* fall through */ }
          }
        }
      }
      
      return null
    }

    let parsed: any
    try {
      parsed = extractJSON(content)
      if (!parsed) {
        throw new Error('No se pudo extraer JSON válido de la respuesta')
      }
    } catch (parseError: any) {
      console.error('JSON Parse error. Content:', content.slice(0, 1000))
      throw new Error('Error parseando JSON de Gemini: ' + content.slice(0, 200))
    }

    if (!parsed.silos) {
      throw new Error('Respuesta sin estructura de silos')
    }

    // Validación post-IA: verificar que los IDs de keywords existen en la lista original
    const validKeywordIds = new Set(keywords.map(k => k.id))
    const validationErrors: string[] = []
    
    // Función para validar IDs y convertirlos a formato de salida
    const validateAndConvert = (silos: SiloProposal[]): { silos: any[]; intentions: { [key: string]: string } } => {
      const convertedSilos = []
      const intentions: { [key: string]: string } = {}
      
      for (const silo of silos) {
        const convertedCategories = []
        for (const cat of silo.categories) {
          const convertedPages = []
          for (const page of cat.pages) {
            // OPCIÓN A: Matching híbrido - intentar ID primero, luego por texto
            let keywordId = page.main_keyword_id
            let mainKeywordText = page.main_keyword || ''
            
            // Si el ID no es válido, buscar por texto (matching flexible)
            if (!keywordId || !validKeywordIds.has(keywordId)) {
              if (mainKeywordText) {
                const mainTextLower = mainKeywordText.toLowerCase().trim()
                // Primero buscar coincidencia exacta
                let match = keywords.find(k => 
                  k.keyword.toLowerCase().trim() === mainTextLower
                )
                // Si no hay coincidencia exacta, buscar por inclusión
                if (!match) {
                  match = keywords.find(k => 
                    k.keyword.toLowerCase().includes(mainTextLower) ||
                    mainTextLower.includes(k.keyword.toLowerCase())
                  )
                }
                if (match) {
                  keywordId = match.id
                  console.log(`Main keyword match por texto: "${mainKeywordText}" → ID: ${keywordId}`)
                } else {
                  console.log(`Main keyword no encontrada: "${mainKeywordText}"`)
                  validationErrors.push(`Keyword "${mainKeywordText}" no encontrada en la lista`)
                  continue
                }
              } else {
                validationErrors.push(`Main keyword ID "${keywordId}" no válido`)
                continue
              }
            }
            
            // Validar secondary keywords IDs - también intentar matching por texto
            const secondaryIds: string[] = []
            const secondaryTexts = page.secondary_keywords || []
            const secondaryIdTexts = page.secondary_keywords_ids || []
            
            // Por cada secondary, primero intentar por ID exacto
            for (const secId of secondaryIdTexts) {
              if (validKeywordIds.has(secId)) {
                secondaryIds.push(secId)
              }
            }
            // Buscar por texto los que no se encontraron por ID - matching flexible
            for (const secText of secondaryTexts) {
              const secTextLower = secText.toLowerCase().trim()
              // Primero buscar coincidencia exacta
              let match = keywords.find(k => 
                k.keyword.toLowerCase().trim() === secTextLower
              )
              // Si no hay coincidencia exacta, buscar por inclusión
              if (!match) {
                match = keywords.find(k => 
                  k.keyword.toLowerCase().includes(secTextLower) ||
                  secTextLower.includes(k.keyword.toLowerCase())
                )
              }
              if (match && !secondaryIds.includes(match.id)) {
                secondaryIds.push(match.id)
              } else if (!match) {
                console.log(`Secondary keyword no encontrada: "${secText}"`)
              }
            }
            
            // Obtener el texto de la keyword principal para intenciones
            const mainKw = keywords.find(k => k.id === keywordId)
            if (mainKw) {
              intentions[mainKw.keyword] = page.intent || 'informational'
            }
            
            convertedPages.push({
              main_keyword: mainKw?.keyword || mainKeywordText || '',
              main_keyword_id: keywordId,
              secondary_keywords: secondaryIds.map(id => {
                const kw = keywords.find(k => k.id === id)
                return kw?.keyword || ''
              }).filter(k => k),
              secondary_keywords_ids: secondaryIds,
              type: page.type,
              is_pillar: page.is_pillar,
              intent: page.intent
            })
          }
          
          if (convertedPages.length > 0) {
            convertedCategories.push({
              name: cat.name,
              pages: convertedPages
            })
          }
        }
        
        if (convertedCategories.length > 0) {
          convertedSilos.push({
            name: silo.name,
            categories: convertedCategories
          })
        }
      }
      
      return { silos: convertedSilos, intentions }
    }

    const { silos: validatedSilos, intentions } = validateAndConvert(parsed.silos)
    
    console.log('Validación de keywords:', validationErrors.length > 0 ? validationErrors.join(', ') : 'OK')

    return {
      silos: validatedSilos,
      intentions,
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
    const BATCH_SIZE = 40
      
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
        .limit(1000)
      
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

    const existingSilos: SiloForPrompt[] = []
    
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

    const aiConfig = await getAIConfig()
    const siloConfig = aiConfig?.silo || { model: 'gemini-2.5-pro', parameters: { maxTokens: 20000, temperature: 0.3 } }
    const aiModel = siloConfig.model
    const aiParams = siloConfig.parameters || {}

    const BATCH_SIZE = 40
    const allSilos: any[] = []
    const allIntentions: { [key: string]: string } = {}
    const allValidationErrors: string[] = []
    const processedKeywordIds: string[] = []
    
    // Process keywords in batches
    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batchKeywords = keywords.slice(i, i + BATCH_SIZE)
      processedKeywordIds.push(...batchKeywords.map(k => k.id))
      
      console.log(`Analyzing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchKeywords.length} keywords with model: ${aiModel}`)
      
      // Convert allSilos to prompt format if needed
      const silosForPrompt: SiloForPrompt[] = useExistingSilos 
        ? existingSilos 
        : (allSilos as any[]).map((silo: any) => ({
            name: silo.name,
            categories: (silo.categories || []).map((cat: any) => ({
              name: cat.name,
              pages: (cat.pages || []).map((page: any) => ({
                main_keyword: page.main_keyword || ''
              }))
            }))
          }))
      
      // Use existing silos from previous batches to avoid duplicates
      const proposal = await analyzeSilosWithGemini(
        batchKeywords, 
        apiKey, 
        silosForPrompt, 
        context || {}, 
        aiModel, 
        aiParams
      )
      
      // Merge results, avoiding duplicate silo names
      for (const silo of proposal.silos) {
        const existingSilo = allSilos.find((s: any) => s.name.toLowerCase() === silo.name.toLowerCase())
        if (!existingSilo) {
          allSilos.push(silo)
        } else {
          // Merge categories into existing silo
          for (const cat of silo.categories) {
            const existingCat = existingSilo.categories.find((c: any) => c.name.toLowerCase() === cat.name.toLowerCase())
            if (!existingCat) {
              existingSilo.categories.push(cat)
            } else {
              // Merge pages into existing category
              for (const page of cat.pages) {
                if (!existingCat.pages.find((p: any) => p.main_keyword_id === page.main_keyword_id)) {
                  existingCat.pages.push(page)
                }
              }
            }
          }
        }
      }
      
      // Merge intentions and errors
      Object.assign(allIntentions, proposal.intentions)
      allValidationErrors.push(...proposal.validationErrors)
    }

    return NextResponse.json({
      success: true,
      keywordCount: keywords.length,
      keywordsAnalyzed: processedKeywordIds.length,
      keywords: processedKeywordIds.map((id, i) => ({ id, keyword: keywords[i].keyword })),
      proposal: allSilos,
      intentions: allIntentions,
      validationErrors: allValidationErrors,
      existingSilosUsed: useExistingSilos && existingSilos.length > 0,
      existingSilosCount: existingSilos.length,
      contextUsed: !!context,
      batchesProcessed: Math.ceil(keywords.length / BATCH_SIZE)
    })

  } catch (error: any) {
    console.error('Error in analyze-proposal:', error)
    return NextResponse.json({ 
      error: error.message || 'Error analyzing keywords',
      details: error.toString()
    }, { status: 500 })
  }
}
