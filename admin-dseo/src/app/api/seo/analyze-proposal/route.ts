import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabase'

const MODEL = 'gemini-2.5-flash-lite'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

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

  const companyContext = `TEMÁTICAS DE LA EMPRESA (d-seo.es):
- Desarrollo Web (sitios web, wordpress, webs corporativas)
- Ecommerce (tiendas online, woocommerce)
- IA (inteligencia artificial, chatbots, machine learning)
- Apps (aplicaciones móviles, desarrollo de apps)
- SEO (posicionamiento, seo local, seo técnico, keyword research)
- Marketing Digital
- Apps`

  const prompt = `${companyContext}

PALABRAS CLAVE A ANALIZAR:
${keywordList}

${existingSilosBlock}

Eres un experto en SEO. Analiza las keywords y devuelve una PROPUESTA DE ESTRUCTURA SILO (NO applies nada, solo propone).

La estructura SILO propuesta debe ser:
- SILO (Tema principal): Grupo de categoría de nivel superior
- CATEGORÍA: Sub-tema dentro del silo
- PÁGINA: Página de contenido específica

Para CADA página, especifica:
- main_keyword: Keyword principal para la página
- secondary_keywords: Keywords secundarias (LSI) para esa página
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
        temperature: 0.3,
        maxOutputTokens: 15000,
        responseMimeType: 'application/json'
      }
    }

    const response = await fetch(
      `${API_URL}/${MODEL}:generateContent?key=${apiKey}`,
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
    } catch (parseError) {
      console.error('JSON Parse error. Content:', content.slice(0, 500))
      throw new Error('Error parseando JSON de Gemini')
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
      return analyzeSilosWithGemini(keywords, apiKey, existingSilos, attempt + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keywordIds, useExistingSilos } = await request.json()
    
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    let keywords: { id: string; keyword: string }[] = []
    
    if (keywordIds && keywordIds.length > 0) {
      const { data } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .in('id', keywordIds)
        .eq('status', 'pending')
      
      keywords = data || []
    } else {
      const { data } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .eq('status', 'pending')
        .limit(500)
      
      keywords = data || []
    }

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'No hay keywords pendientes para analizar' }, { status: 400 })
    }

    const existingSilos: { name: string; categories: { name: string; pages: { main_keyword: string }[] }[] }[] = []
    
    if (useExistingSilos) {
      const { data: silos } = await supabaseClient
        .from('d_seo_admin_silos')
        .select('id, name')

      if (silos && silos.length > 0) {
        for (const silo of silos) {
          const { data: cats } = await supabaseClient
            .from('d_seo_admin_categories')
            .select('id, name')
            .eq('silo_id', silo.id)
          
          const categories = []
          if (cats && cats.length > 0) {
            for (const cat of cats) {
              const { data: pages } = await supabaseClient
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

    const keywordTexts = keywords.map(k => k.keyword)
    
    console.log(`Analyzing ${keywordTexts.length} keywords for SILO proposal...`)
    
    const proposal = await analyzeSilosWithGemini(keywordTexts, apiKey, existingSilos)

    return NextResponse.json({
      success: true,
      keywordCount: keywords.length,
      keywords: keywords.map(k => ({ id: k.id, keyword: k.keyword })),
      proposal: proposal.silos,
      intentions: proposal.intentions,
      existingSilosUsed: useExistingSilos && existingSilos.length > 0,
      existingSilosCount: existingSilos.length
    })

  } catch (error: any) {
    console.error('Error in analyze-proposal:', error)
    return NextResponse.json({ 
      error: error.message || 'Error analyzing keywords',
      details: error.toString()
    }, { status: 500 })
  }
}
