import { NextRequest, NextResponse } from 'next/server'

interface KeywordAnalysis {
  keyword: string
  cluster: string
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational'
  confidence: number
  reasoning: string
  contentType: string
}

const MODEL = 'gemini-2.5-flash-lite'  // Cambiado a Flash Lite para mejores rate limits
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function analyzeBatchWithGemini(
  keywords: string[], 
  apiKey: string,
  attempt: number = 1
): Promise<KeywordAnalysis[]> {
  const MAX_RETRIES = 2
  
  const prompt = `Actúa como un experto en SEO. Analiza EXACTAMENTE estas ${keywords.length} palabras clave.

PALABRAS CLAVE:
${keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')}

Devuelve JSON con array "analyses". Cada elemento:
- keyword: texto exacto
- cluster: 2-3 palabras snake_case (ej: "posicionamiento_web")
- intent: informational|transactional|commercial|navigational
- confidence: 0.0-1.0
- reasoning: máx 6 palabras español
- contentType: categoria|blog|producto|landing|comparativa|guia|servicio

TOTAL: ${keywords.length} objetos en analyses[]

JSON:
{"analyses":[{"keyword":"...","cluster":"...","intent":"...","confidence":0.95,"reasoning":"...","contentType":"..."}]}``

  try {
    console.log(`[Attempt ${attempt}] Sending ${keywords.length} keywords to Gemini ${MODEL}...`)
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8000,
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
        signal: AbortSignal.timeout(60000)
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

    // Parsear JSON
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.error('JSON Parse error. Content:', content)
      throw new Error(`Error parseando JSON: ${error}`)
    }

    const analyses = parsed.analyses || []
    
    if (analyses.length === 0) {
      throw new Error('No se encontraron análisis en la respuesta')
    }
    
    // Validar cantidad de resultados
    if (analyses.length < keywords.length && attempt <= MAX_RETRIES) {
      console.warn(`Expected ${keywords.length}, got ${analyses.length}. Retrying...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return analyzeBatchWithGemini(keywords, apiKey, attempt + 1)
    }

    return analyses

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
    const { keywords } = await request.json()
    
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

    // Estrategia de lotes para Flash Lite (más generoso con rate limits)
    let batchSize: number
    if (keywords.length <= 50) batchSize = keywords.length
    else if (keywords.length <= 500) batchSize = 50
    else batchSize = 100

    const totalBatches = Math.ceil(keywords.length / batchSize)
    const allAnalyses: KeywordAnalysis[] = []
    const failedBatches: number[] = []

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`\n======== BATCH ${batchNum}/${totalBatches} ========`)
      console.log(`Processing ${batch.length} keywords`)
      
      try {
        const batchResults = await analyzeBatchWithGemini(batch, apiKey)
        allAnalyses.push(...batchResults)
        console.log(`✅ Batch ${batchNum} SUCCESS: ${batchResults.length}/${batch.length} results`)
        
        // Pausa entre lotes
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        console.error(`❌ Batch ${batchNum} FAILED:`, error.message)
        failedBatches.push(batchNum)
      }
    }

    console.log(`\n======== ANALYSIS COMPLETE ========`)
    console.log(`Total: ${allAnalyses.length}/${keywords.length} keywords processed`)
    console.log(`Batches: ${totalBatches - failedBatches.length}/${totalBatches} successful`)
    if (failedBatches.length > 0) {
      console.log(`Failed batches: ${failedBatches.join(', ')}`)
    }
    console.log(`=====================================\n`)

    // Agrupar por clusters
    const clusterSuggestions: { [key: string]: string[] } = {}

    allAnalyses.forEach(analysis => {
      const cluster = analysis.cluster
      if (!clusterSuggestions[cluster]) {
        clusterSuggestions[cluster] = []
      }
      clusterSuggestions[cluster].push(analysis.keyword)
    })

    return NextResponse.json({
      success: true,
      analyses: allAnalyses,
      clusterSuggestions,
      totalAnalyzed: allAnalyses.length,
      totalRequested: keywords.length,
      batchesProcessed: totalBatches,
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
