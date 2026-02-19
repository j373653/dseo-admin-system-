import { NextRequest, NextResponse } from 'next/server'

interface KeywordAnalysis {
  keyword: string
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational'
  confidence: number
  reasoning: string
  suggestedCluster: string
  shouldBeStandalone: boolean
}

const MODEL = 'liquid/lfm-2.5-1.2b-thinking:free'
const BATCH_SIZE = 10 // Procesar de 10 en 10 para evitar limitaciones del modelo gratuito

async function analyzeBatch(
  keywords: string[], 
  apiKey: string,
  attempt: number = 1
): Promise<KeywordAnalysis[]> {
  const MAX_RETRIES = 2
  
  const prompt = `Analiza EXACTAMENTE estas ${keywords.length} keywords y devuelve un array con ${keywords.length} elementos.

KEYWORDS A ANALIZAR:
${keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')}

IMPORTANTE: Debes analizar TODAS las ${keywords.length} keywords y devolver un array con ${keywords.length} objetos en el campo "analyses".

Para CADA keyword, devuelve:
- keyword: el texto EXACTO de la keyword (copia tal cual)
- intent: uno de [informational, transactional, commercial, navigational]
- confidence: número entre 0 y 1
- reasoning: máximo 10 palabras explicando por qué
- suggestedCluster: 2-3 palabras en inglés separadas por guiones bajos
- shouldBeStandalone: boolean

Responde ÚNICAMENTE con este formato JSON exacto:
{
  "analyses": [
    {"keyword":"texto exacto 1","intent":"informational","confidence":0.9,"reasoning":"razón breve","suggestedCluster":"nombre_cluster","shouldBeStandalone":false},
    {"keyword":"texto exacto 2","intent":"transactional","confidence":0.85,"reasoning":"otra razón","suggestedCluster":"otro_cluster","shouldBeStandalone":true}
  ]
}`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.d-seo.es',
        'X-Title': 'D-SEO Admin'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto SEO. Tu tarea es analizar keywords y clasificarlas. SIEMPRE responde con el array completo de analyses, uno por cada keyword recibida.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(30000) // 30 segundos timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('Respuesta vacía de OpenRouter')
    }

    console.log(`Batch response (${keywords.length} keywords):`, content.substring(0, 500))

    // Parsear JSON
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.error('JSON Parse error. Raw content:', content)
      throw new Error('Error parseando JSON')
    }

    const analyses = parsed.analyses || []
    
    // Validar que tenemos el número correcto de resultados
    if (analyses.length < keywords.length) {
      console.warn(`Expected ${keywords.length} results, got ${analyses.length}. Retrying...`)
      
      if (attempt <= MAX_RETRIES) {
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000))
        return analyzeBatch(keywords, apiKey, attempt + 1)
      }
    }

    // Validar que todas las keywords están en el resultado
    const resultKeywords = new Set(analyses.map((a: any) => a.keyword?.toLowerCase().trim()))
    const missingKeywords = keywords.filter(k => !resultKeywords.has(k.toLowerCase().trim()))
    
    if (missingKeywords.length > 0) {
      console.warn(`Missing keywords in response:`, missingKeywords)
    }

    return analyses

  } catch (error: any) {
    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying batch (attempt ${attempt + 1})...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return analyzeBatch(keywords, apiKey, attempt + 1)
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

    const apiKey = process.env.OPENROUTER_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no configurada' },
        { status: 500 }
      )
    }

    console.log(`Starting analysis of ${keywords.length} keywords in batches of ${BATCH_SIZE}`)

    // Procesar en lotes
    const allAnalyses: KeywordAnalysis[] = []
    const totalBatches = Math.ceil(keywords.length / BATCH_SIZE)
    const failedBatches: number[] = []

    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batch = keywords.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} keywords)`)
      
      try {
        const batchResults = await analyzeBatch(batch, apiKey)
        
        // Validar resultados
        if (batchResults.length < batch.length) {
          console.warn(`Batch ${batchNum}: Expected ${batch.length}, got ${batchResults.length}`)
          failedBatches.push(batchNum)
        }
        
        allAnalyses.push(...batchResults)
        console.log(`Batch ${batchNum} completed: ${batchResults.length}/${batch.length} results`)
        
        // Pequeña pausa entre lotes para no sobrecargar la API
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        console.error(`Error in batch ${batchNum}:`, error.message)
        failedBatches.push(batchNum)
        // Continuar con el siguiente lote
      }
    }
    
    if (failedBatches.length > 0) {
      console.warn(`Failed batches: ${failedBatches.join(', ')}`)
    }

    console.log(`Total analyses completed: ${allAnalyses.length}/${keywords.length}`)

    // Agrupar por clusters sugeridos
    const clusterSuggestions: { [key: string]: string[] } = {}
    allAnalyses.forEach(analysis => {
      const cluster = analysis.suggestedCluster
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
