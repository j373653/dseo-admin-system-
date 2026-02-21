import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabase'

const TOPICS_FROM_SITEMAP = [
  'desarrollo web',
  'sitios web',
  'wordpress',
  'ecommerce',
  'tienda online',
  'ia',
  'inteligencia artificial',
  'apps',
  'aplicaciones',
  'seo',
  'posicionamiento',
  'marketing digital',
  'local seo',
  'seo técnico',
  'keyword research',
  'sectores',
  'legal',
  'aviso legal',
  'privacidad',
  'cookies'
]

const SERVICES_KEYWORDS = [
  'desarrollo',
  'desarrollador',
  'programación',
  'programador',
  'web',
  'sitio',
  'página',
  'wordpress',
  'wooocommerce',
  'ecommerce',
  'tienda',
  'online',
  'tienda online',
  'ia',
  'inteligencia artificial',
  'ai',
  'machine learning',
  'chatbot',
  'apps',
  'aplicación',
  'aplicaciones móviles',
  'seo',
  'posicionamiento',
  'google',
  'marketing',
  'digital',
  'optimización',
  'redes sociales',
  'social media',
  'copywriting',
  'contenidos',
  'blog',
  ' Landing page',
  'web corporativa'
]

function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateTopicMatch(keyword: string): { match: boolean; reason: string; topic?: string } {
  const normalized = normalizeKeyword(keyword)
  const words = normalized.split(' ')
  
  for (const topic of TOPICS_FROM_SITEMAP) {
    const topicNormalized = normalizeKeyword(topic)
    if (normalized.includes(topicNormalized) || topicNormalized.split(' ').every(w => words.includes(w))) {
      return { match: true, reason: `Coincide con temática: ${topic}`, topic }
    }
  }
  
  for (const service of SERVICES_KEYWORDS) {
    const serviceNormalized = normalizeKeyword(service)
    if (normalized.includes(serviceNormalized) || serviceNormalized.split(' ').every(w => words.includes(w))) {
      return { match: true, reason: `Coincide con servicio: ${service}`, topic: 'servicio' }
    }
  }
  
  return { 
    match: false, 
    reason: `No coincide con ninguna temática de d-seo.es`,
    topic: undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keywordIds, keywordTexts } = await request.json()
    
    let keywords: { id: string; keyword: string }[] = []
    
    if (keywordIds && keywordIds.length > 0) {
      const { data } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .in('id', keywordIds)
        .in('status', ['pending'])
      
      keywords = data || []
    } else if (keywordTexts && keywordTexts.length > 0) {
      keywords = keywordTexts.map((kw: string) => ({ id: '', keyword: kw }))
    } else {
      const { data } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .eq('status', 'pending')
        .limit(500)
      
      keywords = data || []
    }
    
    const results = keywords.map(kw => {
      const analysis = calculateTopicMatch(kw.keyword)
      return {
        id: kw.id,
        keyword: kw.keyword,
        shouldDiscard: !analysis.match,
        reason: analysis.reason,
        topic: analysis.topic
      }
    })
    
    const toDiscard = results.filter(r => r.shouldDiscard)
    const valid = results.filter(r => !r.shouldDiscard)
    
    return NextResponse.json({
      total: results.length,
      valid: valid.length,
      toDiscard: toDiscard.length,
      results,
      summary: {
        validKeywords: valid,
        suggestedToDiscard: toDiscard
      }
    })
    
  } catch (error: any) {
    console.error('Error in filter-by-topic:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
