import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

interface SemanticAnalysisResult {
  duplicates: string[][]
  clusters: { 
    name: string
    entity: string
    keywords: string[] 
    intent: string
    stage: string
    is_pillar: boolean
    out_of_scope: boolean
  }[]
  canibalizations: string[][]
  intentions: { [keyword: string]: string }
}

// Función para obtener el modelo por defecto de la BBDD
async function getDefaultModel(task: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: config } = await supabase
    .from('d_seo_admin_ai_task_config')
    .select(`
      *,
      model:model_id (
        model_id
      )
    `)
    .eq('task', task)
    .eq('is_default', true)
    .single()
  
  if (config?.model?.model_id) {
    return config.model.model_id
  }
  
  // Fallback a gemini-2.5-flash si no hay configuración
  return 'gemini-2.5-flash'
}

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function analyzeBatchWithAI(
  keywords: string[], 
  apiKey: string,
  existingClusters: { name: string; keywords: string[] }[] = [],
  existingClusteredKeywords: string[] = [],
  aiModel: string = 'gemini-2.5-flash',
  attempt: number = 1
): Promise<SemanticAnalysisResult> {
  const MAX_RETRIES = 2
  
  const keywordList = keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')
  
  const existingClusterLines = (existingClusters && existingClusters.length > 0)
    ? existingClusters.map(c => `- ${c.name}: ${c.keywords.join(', ')}`).join('\n')
    : ''

  const existingClusterBlock = existingClusterLines 
    ? `EXISTING CLUSTERS (ya creados - NO incluir estas keywords en los nuevos clusters):\n${existingClusterLines}\n`
    : ''
  
  const existingKwWarning = existingClusteredKeywords.length > 0
    ? `⚠️ IMPORTANTE: Las siguientes keywords YA están clusterizadas. NO las incluyas en los nuevos clusters:\n${existingClusteredKeywords.slice(0, 50).join(', ')}${existingClusteredKeywords.length > 50 ? '...' : ''}\n\n`
    : ''
  
  const prompt = `Eres un experto en SEO especializado en arquitectura de información y análisis semántico. Analiza estas ${keywords.length} palabras clave para d-seo.es (agencia de desarrollo web, software, IA y SEO).

PALABRAS CLAVE:
${keywordList}

${existingClusterBlock}${existingKwWarning}Analiza y devuelve EXACTAMENTE este JSON:

{
  "duplicates": [
    // Keywords que tienen la MISMA intención de búsqueda (duplicados semánticos)
    // Ej: ["diseños web", "diseño web"] o ["tienda online", "tienda virtual"]
    ["kw1", "kw2"],
    ["kw3", "kw4"]
  ],
  "clusters": [
    {
      "name": "nombre_cluster_snake_case",
      "entity": "Entidad Principal (ej: WordPress, CRM, Chatbot IA)",
      "keywords": ["kw1", "kw2"],
      "intent": "informational|navigational|commercial_investigation|transactional",
      "stage": "TOFU|MOFU|BOFU",
      "is_pillar": true|false,
      "out_of_scope": true|false
    }
  ],
  "canibalizations": [
    // Keywords diferentes que COMPITEN por el mismo ranking
    ["kw_a", "kw_b"]
  ],
  "intentions": {
    "keyword_exacta": "informational|navigational|commercial_investigation|transactional"
  }
}

REGLAS OBLIGATORIAS:
1. INTENCIÓN DE BÚSQUEDA (4 tipos):
   - informational: El usuario quiere SABER algo ("qué es...", "cómo hacer...")
   - navigational: El usuario quiere IR a un sitio específico ("wordpress madrid", "d-seo")
   - commercial_investigation: El usuario quiere COMPARAR antes de comprar ("mejor herramienta...", "vs...")
   - transactional: El usuario quiere COMPRAR/HACER ACCIÓN ("precios", "contratar", "demo")

2. ETAPA DEL FUNNEL (User Journey):
   - TOFU (Top): Keywords informativas广泛的 ("qué es", "cómo funciona", "guía completa")
   - MOFU (Middle): Comparaciones y investigación ("mejor herramienta", "vs", "comparativa")
   - BOFU (Bottom): Transaccionales ("precios", "contratar", "presupuesto", "demo")

3. DETECCIÓN DE ENTIDADES:
   - Identifica la entidad principal de cada cluster
   - Ej: "crear crm", "software ventas" → entity: "CRM"
   - Ej: "wordpress madrid", "diseño wp" → entity: "WordPress"
   - Esto es CRÍTICO para el SEO moderno basado en entidades de Google

4. AGRUPACIÓN SEMÁNTICA (NO solo por palabras):
   - "hacer página web" y "diseño de sitios" = MISMO cluster (misma intención)
   - Agrupa por SIGNIFICADO, no por raíz de palabra

5. OUT OF SCOPE:
   - Si una keyword NO es relevante para d-seo.es, marcala "out_of_scope": true
   - NO la forces en un cluster si no encaja

6. IS_PILLAR:
   - true para la keyword más importante del cluster (la más genérica/transaccional)
   - false para las long-tail que apoyan al pillar

TOTAL: keywords.length objetos distribuidos en los arrays
JSON:`

  try {
    console.log(`[Attempt ${attempt}] Sending ${keywords.length} keywords to ${aiModel} for semantic analysis...`)
    
    // Determinar si usar OpenRouter o Google
    const isOpenRouter = aiModel.includes('openai/') || aiModel.includes('openrouter/') || aiModel.includes('/') || aiModel.includes(':free')
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    let response
    let content
    
    if (isOpenRouter) {
      // OpenRouter API
      const requestBody = {
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 12000,
        temperature: 0.2,
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
          signal: AbortSignal.timeout(120000)
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
      const generationConfig: any = {
        temperature: 0.2,
        maxOutputTokens: 12000,
        responseMimeType: 'application/json'
      }

      // Solo Flash puede usar thinking_budget: 0
      if (aiModel.includes('flash')) {
        generationConfig.thinkingConfig = {
          thinkingBudget: 0
        }
      }

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      }
      
      response = await fetch(
        `${GOOGLE_API_URL}/${aiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
        throw new Error('Respuesta invalida de Gemini')
      }

      content = data.candidates[0].content.parts[0].text
    }

    let parsed: any
    try {
      // Extraer JSON de la respuesta
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim())
      } else {
        parsed = JSON.parse(content)
      }
    } catch (error) {
      console.error('JSON Parse error. Content:', content.slice(0, 500))
      throw new Error('Error parseando JSON')
    }

    if (!parsed.duplicates || !parsed.clusters) {
      throw new Error('Respuesta incompleta del modelo')
    }

    return {
      duplicates: parsed.duplicates || [],
      clusters: parsed.clusters || [],
      canibalizations: parsed.canibalizations || [],
      intentions: parsed.intentions || {}
    }

  } catch (error: any) {
    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying batch (attempt ${attempt + 1})...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return analyzeBatchWithAI(keywords, apiKey, existingClusters, existingClusteredKeywords, aiModel, attempt + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { keywords, existingClusters, model, provider, apiKeyEnvVar } = await request.json()
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de keywords' },
        { status: 400 }
      )
    }

    // Obtener keywords YA clusterizadas (para evitar duplicados en el prompt)
    const { data: clusteredKeywords } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('keyword')
      .eq('status', 'clustered')
    
    const existingClusteredKeywords = clusteredKeywords 
      ? clusteredKeywords.map(k => k.keyword.toLowerCase().trim())
      : []
    
    console.log('Existing clustered keywords count:', existingClusteredKeywords.length)

    // Obtener modelo por defecto de BBDD si no se proporciona
    let aiModel = model
    if (!aiModel) {
      aiModel = await getDefaultModel('cluster')
      console.log('No model provided, using default from DB:', aiModel)
    }
    
    // Seleccionar API key según el modelo y proveedor
    let apiKey: string
    
    // Determinar el proveedor y API key
    const providerName = provider?.toLowerCase() || ''
    const apiKeyEnvVarName = apiKeyEnvVar || ''
    
    // Si se especifica una variable de entorno específica, usarla directamente
    if (apiKeyEnvVarName) {
      apiKey = process.env[apiKeyEnvVarName] || ''
      console.log('Using API key from env var:', apiKeyEnvVarName)
    } else if (providerName.includes('google') || !providerName) {
      // Google provider
      if (aiModel === 'gemini-2.5-pro') {
        apiKey = process.env.GEMINI_2_5_PRO_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
      } else {
        apiKey = process.env.GEMINI_MAIN_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
      }
    } else if (providerName.includes('openrouter')) {
      // OpenRouter provider
      apiKey = process.env.OPENROUTER_API_KEY || ''
    } else {
      // Default fallback
      apiKey = process.env.GOOGLE_AI_API_KEY || ''
    }
    
    console.log('=== API DEBUG analyze-keywords ===')
    console.log('Model selected:', aiModel)
    console.log('Provider selected:', provider)
    console.log('API key exists:', !!apiKey)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      )
    }

    console.log(`Starting analysis of ${keywords.length} keywords with ${aiModel}`)

    let batchSize: number
    if (keywords.length <= 50) batchSize = keywords.length
    else if (keywords.length <= 500) batchSize = 50
    else batchSize = 100

    const totalBatches = Math.ceil(keywords.length / batchSize)
    const allDuplicates: string[][] = []
    const allClusters: { name: string; entity: string; keywords: string[]; intent: string; stage: string; is_pillar: boolean; out_of_scope: boolean }[] = []
    const allCanibalizations: string[][] = []
    const allIntentions: { [keyword: string]: string } = {}
    const failedBatches: number[] = []

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`\n======== BATCH ${batchNum}/${totalBatches} ========`)
      console.log(`Processing ${batch.length} keywords`)
      
      try {
        const batchResults = await analyzeBatchWithAI(batch, apiKey, existingClusters || [], existingClusteredKeywords, aiModel)
        
        allDuplicates.push(...batchResults.duplicates)
        allClusters.push(...batchResults.clusters)
        allCanibalizations.push(...batchResults.canibalizations)
        Object.assign(allIntentions, batchResults.intentions)
        
        console.log(`✅ Batch ${batchNum} SUCCESS`)
        console.log(`   - Duplicates: ${batchResults.duplicates.length}`)
        console.log(`   - Clusters: ${batchResults.clusters.length}`)
        
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        console.error(`❌ Batch ${batchNum} FAILED:`, error.message)
        failedBatches.push(batchNum)
      }
    }

    console.log(`\n======== ANALYSIS COMPLETE ========`)
    console.log(`Total: ${keywords.length} keywords processed`)
    console.log(`Duplicates found: ${allDuplicates.length}`)
    console.log(`Clusters found: ${allClusters.length}`)
    console.log(`Canibalizations found: ${allCanibalizations.length}`)
    console.log(`Batches: ${totalBatches - failedBatches.length}/${totalBatches} successful`)
    console.log(`=====================================\n`)

    // Construir estructura SILO a partir de clusters si aplica
    const silosFromClusters: any[] = []
    if (allClusters && allClusters.length > 0) {
      const siloName = 'Cluster IA'
      const categoryMap = new Map<string, { name: string; pages: any[] }>()
      for (const cl of allClusters) {
        if (cl.out_of_scope) continue // Saltar keywords out of scope
        
        const catName = cl.name || 'Unnamed'
        const entry = categoryMap.get(catName) || { name: catName, pages: [] }
        entry.pages.push({
          mainKeyword: cl.keywords[0] || '',
          secondaryKeywords: cl.keywords.slice(1),
          intent: cl.intent,
          stage: cl.stage || 'MOFU',
          entity: cl.entity || '',
          urlTarget: `/servicios/seo/${slugify(cl.name)}`,
          isPillar: !!cl.is_pillar,
          clusterType: cl.is_pillar ? 'pillar' : 'support'
        })
        categoryMap.set(catName, entry)
      }
      const categories = Array.from(categoryMap.values())
      silosFromClusters.push({ name: siloName, categories })
    }

    return NextResponse.json({
      success: true,
      duplicates: allDuplicates.map(dup => ({ keywords: dup })),
      clusters: allClusters,
      canibalizations: allCanibalizations.map(can => ({ keywords: can })),
      intentions: allIntentions,
      silos: silosFromClusters,
      totalAnalyzed: keywords.length,
      totalRequested: keywords.length,
      batchesProcessed: totalBatches - failedBatches.length,
      failedBatches: failedBatches.length > 0 ? failedBatches : undefined
    })

  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
