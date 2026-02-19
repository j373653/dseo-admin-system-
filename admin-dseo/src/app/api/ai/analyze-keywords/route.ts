import { NextRequest, NextResponse } from 'next/server'

interface KeywordAnalysis {
  keyword: string
  intent: 'informational' | 'transactional' | 'commercial' | 'navigational'
  confidence: number
  reasoning: string
  suggestedCluster: string
  shouldBeStandalone: boolean
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

    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada' },
        { status: 500 }
      )
    }

    // Limitar a 50 keywords por análisis para no sobrecargar
    const keywordsToAnalyze = keywords.slice(0, 50)

    const prompt = `Analiza las siguientes keywords de SEO y determina su intención de búsqueda (search intent).
    
Keywords a analizar:
${keywordsToAnalyze.map((k: string, i: number) => `${i + 1}. ${k}`).join('\n')}

Para cada keyword, determina:
1. Intención: informational (busca información), transactional (quiere comprar/contratar), commercial (investigando opciones antes de comprar), o navigational (busca una página específica)
2. Confianza: 0-1 (qué tan seguro estás)
3. Razonamiento: por qué clasificaste así en 1-2 frases
4. Cluster sugerido: nombre corto (2-3 palabras) del grupo temático
5. ¿URL propia?: true si merece página dedicada, false si puede ir con otras similares

Responde SOLO con un JSON válido con este formato:
{
  "analyses": [
    {
      "keyword": "texto exacto",
      "intent": "informational|transactional|commercial|navigational",
      "confidence": 0.95,
      "reasoning": "explicación breve",
      "suggestedCluster": "nombre cluster",
      "shouldBeStandalone": true|false
    }
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Puedes cambiar a 'gpt-4' para mejor precisión
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en SEO y análisis de intención de búsqueda. Responde solo con JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Error en API de OpenAI', details: errorData },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      return NextResponse.json(
        { error: 'Respuesta vacía de OpenAI' },
        { status: 500 }
      )
    }

    // Parsear la respuesta JSON
    let analyses: KeywordAnalysis[]
    try {
      // Extraer JSON si viene envuelto en markdown
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/{[\s\S]*}/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)
      analyses = parsed.analyses || parsed
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', content)
      return NextResponse.json(
        { error: 'Error parseando respuesta', rawResponse: content },
        { status: 500 }
      )
    }

    // Agrupar por clusters sugeridos
    const clusterSuggestions: { [key: string]: string[] } = {}
    analyses.forEach(analysis => {
      const cluster = analysis.suggestedCluster
      if (!clusterSuggestions[cluster]) {
        clusterSuggestions[cluster] = []
      }
      clusterSuggestions[cluster].push(analysis.keyword)
    })

    return NextResponse.json({
      success: true,
      analyses,
      clusterSuggestions,
      totalAnalyzed: analyses.length
    })

  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
