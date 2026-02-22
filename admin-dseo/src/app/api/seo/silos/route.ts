import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { supabaseClient } from '@/lib/supabase'

// GET: fetch SILO hierarchy: Silos -> Categories -> Pages -> Keywords
export async function GET() {
  try {
    const { data: silos, error: silosError } = await supabaseClient.from('d_seo_admin_silos').select('id, name, description')
    
    if (silosError) {
      return NextResponse.json({ error: silosError.message }, { status: 500 })
    }
    
    const { data: assignments } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .select(`
        id,
        page_id,
        keyword:raw_keywords(id, keyword, search_volume, intent)
      `)
    
    const pageKeywordsMap: { [pageId: string]: any[] } = {}
    
    if (assignments) {
      for (const a of assignments) {
        const pageId = a.page_id
        if (!pageKeywordsMap[pageId]) {
          pageKeywordsMap[pageId] = []
        }
        const kw = a.keyword as any
        if (kw && Array.isArray(kw) && kw.length > 0) {
          const k = kw[0]
          pageKeywordsMap[pageId].push({
            id: k.id,
            keyword: k.keyword,
            search_volume: k.search_volume,
            intent: k.intent
          })
        } else if (kw && !Array.isArray(kw)) {
          pageKeywordsMap[pageId].push({
            id: kw.id,
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            intent: kw.intent
          })
        }
      }
    }
    
    const result: any[] = []
    const silosList = silos || []
    
    if (silosList.length > 0) {
      for (const silo of silosList) {
        const { data: cats } = await supabaseClient.from('d_seo_admin_categories').select('id, name, description').eq('silo_id', silo.id)
        const categories = [] as any[]
        if (cats && cats.length > 0) {
          for (const cat of cats) {
            const { data: pages } = await supabaseClient.from('d_seo_admin_pages').select('id, main_keyword, url_target, is_pillar, content_type_target, pillar_data').eq('category_id', cat.id)
            
            const pagesWithKeywords = (pages || []).map(p => ({
              ...p,
              keywords: pageKeywordsMap[p.id] || []
            }))
            
            categories.push({ id: cat.id, name: cat.name, description: cat.description, pages: pagesWithKeywords })
          }
        }
        result.push({ id: silo.id, name: silo.name, description: silo.description, categories })
      }
    }
    return NextResponse.json({ silos: result })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error fetching silos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, parent_silo_id } = await req.json()
    console.log('Creating silo:', name, description)
    const { data, error } = await supabaseClient.from('d_seo_admin_silos').insert({ name, description, parent_silo_id }).select().single()
    if (error) {
      console.error('Error creating silo:', error)
      throw new Error(error.message)
    }
    console.log('Silo created:', data)
    return NextResponse.json({ silo: data })
  } catch (err: any) {
    console.error('Error in POST silos:', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
