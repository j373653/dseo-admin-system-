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
  apiKey: string
): Promise<KeywordAnalysis[]> {
  const prompt = `Analiza estas ${keywords.length} keywords de SEO y responde SOLO con JSON válido:

${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Para cada keyword, devuelve en JSON:
- keyword: texto exacto
- intent: informational|transactional|commercial|navigational
- confidence: número 0-1
- reasoning: breve explicación en español
- suggestedCluster: nombre corto del tema (2-3 palabras en snake_case)
- shouldBeStandalone: true si merece URL propia, false si agrupar

Formato JSON exacto:
{"analyses":[{"keyword":"...","intent":"...","confidence":0.95,"reasoning":"...","suggestedCluster":"...","shouldBeStandalone":true/false}]}`

Responde ÚNICAMENTE el JSON, sin texto adicional.`

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
          content: 'Eres un experto SEO. Responde SOLO con JSON válido, sin markdown ni texto adicional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' } // Forzar formato JSON
    })
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

  console.log('Raw response:', content.substring(0, 200) + '...')

  // Parsear JSON
  try {
    const parsed = JSON.parse(content)
    return parsed.analyses || []
  } catch (error) {
    console.error('Parse error, content:', content)
    throw new Error('Error parseando JSON de respuesta')
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

    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batch = keywords.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} keywords)`)
      
      try {
        const batchResults = await analyzeBatch(batch, apiKey)
        allAnalyses.push(...batchResults)
        console.log(`Batch ${batchNum} completed: ${batchResults.length} results`)
      } catch (error: any) {
        console.error(`Error in batch ${batchNum}:`, error.message)
        // Continuar con el siguiente lote aunque uno falle
      }
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
      batchesProcessed: totalBatches
    })

  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
