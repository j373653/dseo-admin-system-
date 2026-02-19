import { NextRequest, NextResponse } from 'next/server'

interface KeywordAnalysis {
  keyword: string
  cluster: string
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational'
  confidence: number
  reasoning: string
  contentType: string
  standaloneUrl: boolean
}

const MODEL = 'gemini-2.5-flash'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function analyzeBatchWithGemini(
  keywords: string[], 
  apiKey: string,
  attempt: number = 1
): Promise<KeywordAnalysis[]> {
  const MAX_RETRIES = 2
  
  const prompt = `Actúa como un experto en SEO. Analiza EXACTAMENTE estas ${keywords.length} palabras clave y agrúpalas en clusters semánticos.

PALABRAS CLAVE A ANALIZAR:
${keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')}

Para CADA palabra clave, devuelve un objeto JSON con:
- keyword: el texto EXACTO de la palabra clave (copia tal cual)
- cluster: nombre del grupo temático (2-3 palabras en snake_case, ej: "posicionamiento_web", "redes_sociales")
- intent: una de [informational, transactional, commercial, navigational]
- confidence: número entre 0.0 y 1.0
- reasoning: máximo 10 palabras explicando por qué en español
- contentType: qué tipo de contenido recomiendas (categoria, blog, producto, landing, comparativa, guia, servicio)
- standaloneUrl: true si merece página dedicada, false si se puede agrupar

IMPORTANTE: Debes analizar TODAS las ${keywords.length} palabras clave y devolver exactamente ${keywords.length} objetos en el array "analyses".

Responde ÚNICAMENTE con este formato JSON exacto, sin markdown ni texto adicional:
{
  "analyses": [
    {
      "keyword": "texto exacto 1",
      "cluster": "nombre_cluster",
      "intent": "informational",
      "confidence": 0.95,
      "reasoning": "breve explicación",
      "contentType": "blog",
      "standaloneUrl": false
    }
  ]
}`

  try {
    console.log(`[Attempt ${attempt}] Sending ${keywords.length} keywords to Gemini...`)
    console.log(`Keywords to analyze:`, keywords.slice(0, 5).join(', ') + (keywords.length > 5 ? '...' : ''))
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json'
      }
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...')
    
    const response = await fetch(
      `${API_URL}/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000) // 60 segundos timeout
      }
    )

    console.log(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('Response data structure:', Object.keys(data))
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Invalid response structure:', JSON.stringify(data, null, 2))
      throw new Error('Respuesta inválida de Gemini: estructura incorrecta')
    }

    const content = data.candidates[0].content.parts[0].text
    console.log('Raw response content:', content.substring(0, 500))

    // Parsear JSON
    let parsed: any
    try {
      parsed = JSON.parse(content)
      console.log('Parsed JSON keys:', Object.keys(parsed))
    } catch (error) {
      console.error('JSON Parse error. Raw content:', content)
      throw new Error(`Error parseando JSON: ${error}`)
    }

    const analyses = parsed.analyses || []
    console.log(`Received ${analyses.length} analyses`)
    
    if (analyses.length === 0) {
      console.error('No analyses found in response. Parsed data:', parsed)
      throw new Error('No se encontraron análisis en la respuesta')
    }
    
    // Validar cantidad de resultados
    if (analyses.length < keywords.length) {
      console.warn(`Expected ${keywords.length} results, got ${analyses.length}. Missing keywords.`)
      
      if (attempt <= MAX_RETRIES) {
        console.log(`Retrying... (${attempt}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return analyzeBatchWithGemini(keywords, apiKey, attempt + 1)
      }
    }

    return analyses

  } catch (error: any) {
    console.error(`Error in attempt ${attempt}:`, error.message)
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

    console.log(`Starting analysis of ${keywords.length} keywords with Gemini`)

    // Estrategia de lotes adaptativa
    let batchSize: number
    if (keywords.length <= 50) batchSize = keywords.length
    else if (keywords.length <= 200) batchSize = 50
    else if (keywords.length <= 500) batchSize = 100
    else batchSize = 150

    const totalBatches = Math.ceil(keywords.length / batchSize)
    const allAnalyses: KeywordAnalysis[] = []
    const failedBatches: number[] = []

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`\n======== BATCH ${batchNum}/${totalBatches} ========`)
      console.log(`Processing ${batch.length} keywords`)
      console.log(`Keywords: ${batch.slice(0, 3).join(', ')}${batch.length > 3 ? '...' : ''}`)
      
      try {
        const batchResults = await analyzeBatchWithGemini(batch, apiKey)
        allAnalyses.push(...batchResults)
        console.log(`✅ Batch ${batchNum} SUCCESS: ${batchResults.length}/${batch.length} results`)
        
        // Pausa entre lotes para no sobrecargar
        if (batchNum < totalBatches) {
          console.log('Waiting 1s before next batch...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error: any) {
        console.error(`❌ Batch ${batchNum} FAILED:`, error.message)
        failedBatches.push(batchNum)
      }
      console.log(`======== END BATCH ${batchNum} ========\n`)
    }

    console.log(`Analysis complete: ${allAnalyses.length}/${keywords.length} keywords processed`)

    // Agrupar por clusters
    const clusterSuggestions: { [key: string]: string[] } = {}
    const standaloneUrls: string[] = []

    allAnalyses.forEach(analysis => {
      if (analysis.standaloneUrl) {
        standaloneUrls.push(analysis.keyword)
      } else {
        const cluster = analysis.cluster
        if (!clusterSuggestions[cluster]) {
          clusterSuggestions[cluster] = []
        }
        clusterSuggestions[cluster].push(analysis.keyword)
      }
    })

    return NextResponse.json({
      success: true,
      analyses: allAnalyses,
      clusterSuggestions,
      standaloneUrls,
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
