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
    
    // Fetch all keyword assignments with keyword_id
    const { data: assignments } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .select('id, page_id, keyword_id')
    
    const pageKeywordsMap: { [pageId: string]: any[] } = {}
    
    if (assignments && assignments.length > 0) {
      // Get unique keyword IDs
      const keywordIds = [...new Set(assignments.map(a => a.keyword_id).filter(Boolean))]
      
      if (keywordIds.length > 0) {
        // Fetch all keywords in one call
        const { data: keywords } = await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .select('id, keyword, search_volume, intent')
          .in('id', keywordIds)
        
        // Build a map of keyword_id -> keyword data
        const keywordMap: { [id: string]: any } = {}
        if (keywords) {
          for (const kw of keywords) {
            keywordMap[kw.id] = kw
          }
        }
        
        // Map keywords to pages
        for (const a of assignments) {
          const pageId = a.page_id
          const kw = keywordMap[a.keyword_id]
          if (pageId && kw) {
            if (!pageKeywordsMap[pageId]) {
              pageKeywordsMap[pageId] = []
            }
            pageKeywordsMap[pageId].push({
              id: kw.id,
              keyword: kw.keyword,
              search_volume: kw.search_volume,
              intent: kw.intent
            })
          }
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
    const { data, error } = await supabaseClient.from('d_seo_admin_silos').insert({ name, description, parent_silo_id }).select().single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ silo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    
    const { error } = await supabaseClient.from('d_seo_admin_silos').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    
    const body = await req.json()
    const { name, description } = body
    
    const { data, error } = await supabaseClient
      .from('d_seo_admin_silos')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return NextResponse.json({ silo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
