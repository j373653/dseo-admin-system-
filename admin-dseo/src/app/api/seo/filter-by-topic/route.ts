import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function getAIConfig() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data } = await supabase
    .from('d_seo_admin_ai_config')
    .select('task, model, parameters, active')
  
  if (!data) return {}
  
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
  
  const { data, error } = await supabase
    .from('d_seo_admin_company_context')
    .select('key, value')
  
  if (error || !data) {
    console.log('Using default context (DB not available)')
    return null
  }
  
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

function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateTopicMatch(
  keyword: string, 
  services: string[] = [], 
  discardTopics: string[] = []
): { match: boolean; reason: string; topic?: string } {
  const normalized = normalizeKeyword(keyword)
  const words = normalized.split(' ')
  
  // First check if it should be discarded (off-topic)
  for (const topic of discardTopics) {
    const topicNormalized = normalizeKeyword(topic)
    if (normalized.includes(topicNormalized) || topicNormalized.split(' ').some(w => words.includes(w))) {
      return { 
        match: false, 
        reason: `Descartar: "${topic}" no es temática de d-seo.es`,
        topic: 'off-topic'
      }
    }
  }
  
  // Then check if it matches any service (more flexible - ANY word match)
  for (const service of services) {
    const serviceNormalized = normalizeKeyword(service)
    const serviceWords = serviceNormalized.split(' ').filter(w => w.length > 2) // Ignore short words
    
    // Match if ANY significant word from service is in keyword
    const hasMatch = serviceWords.some(w => words.includes(w))
    if (hasMatch) {
      return { match: true, reason: `Coincide con servicio: ${service}`, topic: 'servicio' }
    }
  }
  
  return { 
    match: false, 
    reason: `No coincide con ningún servicio de d-seo.es`,
    topic: undefined
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { keywordIds, keywordTexts } = await request.json()
    
    const context = await getCompanyContext()
    console.log('Context loaded:', context ? 'yes' : 'no')
    console.log('Services from context:', context?.services)
    console.log('Discard topics from context:', context?.discard_topics)
    
    const services = context?.services || [
      'desarrollo web', 'sitios web', 'wordpress', 'ecommerce', 'tienda online',
      'ia', 'inteligencia artificial', 'apps', 'aplicaciones', 'seo',
      'posicionamiento', 'marketing digital', 'optimización web'
    ]
    
    const discardTopics = context?.discard_topics || [
      'redes sociales', 'facebook', 'instagram', 'twitter', 'ads', 'google ads',
      'publicidad', 'hosting', 'dominios', 'fotografía', 'diseño gráfico'
    ]
    
    let keywords: { id: string; keyword: string }[] = []
    
    if (keywordIds && keywordIds.length > 0) {
      const { data } = await supabase
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .in('id', keywordIds)
        .in('status', ['pending'])
      
      keywords = data || []
    } else if (keywordTexts && keywordTexts.length > 0) {
      keywords = keywordTexts.map((kw: string) => ({ id: '', keyword: kw }))
    } else {
      const { data } = await supabase
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword')
        .eq('status', 'pending')
        .limit(2000)
      
      keywords = data || []
    }
    
    const results = keywords.map(kw => {
      const analysis = calculateTopicMatch(kw.keyword, services, discardTopics)
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
