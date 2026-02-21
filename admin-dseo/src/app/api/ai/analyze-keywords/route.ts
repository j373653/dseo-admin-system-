import { NextRequest, NextResponse } from 'next/server'

interface KeywordAnalysis {
  keyword: string
  cluster: string
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational'
  confidence: number
  reasoning: string
  contentType: string
  content_type_target: 'service' | 'blog' | 'landing'
}

interface SemanticAnalysisResult {
  duplicates: string[][]
  clusters: { name: string; keywords: string[]; intent: string; is_pillar: boolean }[]
  canibalizations: string[][]
  intentions: { [keyword: string]: string }
}

const MODEL = 'gemini-2.5-flash-lite'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function analyzeBatchWithGemini(
  keywords: string[], 
  apiKey: string,
  existingClusters: { name: string; keywords: string[] }[] = [],
  attempt: number = 1
): Promise<SemanticAnalysisResult> {
  const MAX_RETRIES = 2
  
  const keywordList = keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')
  const existingClusterLines = (existingClusters && existingClusters.length > 0)
    ? existingClusters.map(c => `- ${c.name}: ${c.keywords.join(', ')}`).join('\n')
    : ''

  const existingClusterBlock = existingClusterLines ? `EXISTING CLUSTERS:\n${existingClusterLines}\n` : ''
  
  const prompt = `Eres un experto en SEO. Analiza estas ${keywords.length} palabras clave y devuelve un análisis semántico completo.

PALABRAS CLAVE:
${keywordList}

${existingClusterBlock}Analiza y devuelve EXACTAMENTE este JSON:

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
      "keywords": ["kw1", "kw2"],
      "intent": "informational|transactional|commercial",
      "is_pillar": true/false
    }
  ],
  "canibalizations": [
    // Keywords diferentes que COMPITEN por el mismo ranking
    ["kw_a", "kw_b"]
  ],
  "intentions": {
    "keyword_exacta": "informational|transactional|commercial"
  }
}

REGLAS:
1. duplicates: Si "diseños web" y "diseño web" significan lo MISMO, están en un grupo
2. clusters: Agrupa por tema/semántica. is_pillar=true para el más importante del grupo
3. canibalizations: Keywords diferentes pero muy similares que podrían competir
4. intentions: La intención de búsqueda de cada keyword

TOTAL: keywords.length objetos distribuidos en los arrays
JSON:`

  try {
    console.log(`[Attempt ${attempt}] Sending ${keywords.length} keywords to Gemini ${MODEL} for semantic analysis...`)
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 12000,
        responseMimeType: 'application/json'
      }
    }
    
    const response = await fetch(
      `${API_URL}/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(90000)
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

    const content = data.candidates[0].content.parts[0].text

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.error('JSON Parse error. Content:', content.slice(0, 500))
      throw new Error('Error parseando JSON')
    }

    if (!parsed.duplicates || !parsed.clusters) {
      throw new Error('Respuesta incompleta de Gemini')
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
      return analyzeBatchWithGemini(keywords, apiKey, attempt + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keywords, existingClusters } = await request.json()
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de keywords' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY no configurada' },
        { status: 500 }
      )
    }

    console.log(`Starting analysis of ${keywords.length} keywords with Gemini ${MODEL}`)

    let batchSize: number
    if (keywords.length <= 50) batchSize = keywords.length
    else if (keywords.length <= 500) batchSize = 50
    else batchSize = 100

    const totalBatches = Math.ceil(keywords.length / batchSize)
    const allDuplicates: string[][] = []
    const allClusters: { name: string; keywords: string[]; intent: string; is_pillar: boolean }[] = []
    const allCanibalizations: string[][] = []
    const allIntentions: { [keyword: string]: string } = {}
    const failedBatches: number[] = []

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`\n======== BATCH ${batchNum}/${totalBatches} ========`)
      console.log(`Processing ${batch.length} keywords`)
      
      try {
        const batchResults = await analyzeBatchWithGemini(batch, apiKey, existingClusters || [])
        
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

    return NextResponse.json({
      success: true,
      duplicates: allDuplicates.map(dup => ({ keywords: dup })),
      clusters: allClusters,
      canibalizations: allCanibalizations.map(can => ({ keywords: can })),
      intentions: allIntentions,
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
