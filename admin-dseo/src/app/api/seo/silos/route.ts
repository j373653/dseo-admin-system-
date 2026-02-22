import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { supabaseClient } from '@/lib/supabase'

// GET: fetch SILO hierarchy: Silos -> Categories -> Pages -> Keywords
export async function GET() {
  try {
    // Get all silos
    const { data: silos } = await supabaseClient.from('d_seo_admin_silos').select('id, name, description')
    
    // Get all keyword assignments with keyword data
    const { data: assignments } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .select(`
        id,
        page_id,
        keyword:raw_keywords(id, keyword, search_volume, intent)
      `)
    
    // Get all pages for easy lookup
    const { data: allPages } = await supabaseClient
      .from('d_seo_admin_pages')
      .select('id, main_keyword, url_target, is_pillar, content_type_target, category_id')
    
    // Create a map of page_id -> keywords
    const pageKeywordsMap: { [pageId: string]: any[] } = {}
    
    if (assignments) {
      for (const a of assignments) {
        const pageId = a.page_id
        if (!pageKeywordsMap[pageId]) {
          pageKeywordsMap[pageId] = []
        }
        if (a.keyword) {
          pageKeywordsMap[pageId].push({
            id: a.keyword.id,
            keyword: a.keyword.keyword,
            search_volume: a.keyword.search_volume,
            intent: a.keyword.intent
          })
        }
      }
    }
    
    const result: any[] = []
    if (silos && silos.length > 0) {
      for (const silo of silos) {
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
    const { data, error } = await supabaseClient.from('d_seo_admin_silos').insert({ name, description, parent_silo_id }).select().single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ silo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
