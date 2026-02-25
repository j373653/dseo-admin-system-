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
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .select('id, page_id, keyword_id')
    
    console.log('=== SILO API DEBUG ===')
    console.log('Assignments count:', assignments?.length || 0)
    console.log('Assignments error:', assignmentsError)
    
    const pageKeywordsMap: { [pageId: string]: any[] } = {}
    let keywordIds: any[] = []
    let keywords: any[] = []
    
    if (assignments && assignments.length > 0) {
      // Get unique keyword IDs
      keywordIds = [...new Set(assignments.map(a => a.keyword_id).filter(Boolean))]
      console.log('Unique keyword IDs:', keywordIds.length)
      
      if (keywordIds.length > 0) {
        // Fetch keywords in chunks of 100 to avoid .in() limit issues
        const allKeywords: any[] = []
        const chunkSize = 100
        
        for (let i = 0; i < keywordIds.length; i += chunkSize) {
          const chunk = keywordIds.slice(i, i + chunkSize)
          const { data: chunkKeywords } = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .select('id, keyword, search_volume, intent')
            .in('id', chunk)
          
          if (chunkKeywords) {
            allKeywords.push(...chunkKeywords)
          }
        }
        
        keywords = allKeywords
        console.log('Keywords fetched (chunked):', keywords.length)
        
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
        
        console.log('Pages with keywords:', Object.keys(pageKeywordsMap).length)
      }
    }
    
    // Debug info - include in response
    const debugInfo = {
      assignmentsCount: assignments?.length || 0,
      keywordIdsCount: keywordIds?.length || 0,
      keywordsFetched: keywords?.length || 0,
      pagesWithKeywords: Object.keys(pageKeywordsMap).length
    }
    console.log('Debug info:', debugInfo)
    
    const result: any[] = []
    const silosList = silos || []
    
    // Build keyword count per page
    const pageKeywordCount: { [pageId: string]: number } = {}
    for (const pageId in pageKeywordsMap) {
      pageKeywordCount[pageId] = pageKeywordsMap[pageId].length
    }
    
    if (silosList.length > 0) {
      for (const silo of silosList) {
        // Get categories for this silo
        const { data: cats } = await supabaseClient.from('d_seo_admin_categories').select('id, name, description').eq('silo_id', silo.id)
        
        // Count total keywords for this silo
        let totalKeywords = 0
        const categories = [] as any[]
        if (cats && cats.length > 0) {
          for (const cat of cats) {
            const { data: pages } = await supabaseClient
              .from('d_seo_admin_pages')
              .select('id, main_keyword, url_target, is_pillar, content_type_target, pillar_data')
              .eq('category_id', cat.id)
              .order('created_at', { ascending: false })
            
            const pagesWithKeywords = (pages || []).map(p => {
              const kwCount = pageKeywordCount[p.id] || 0
              totalKeywords += kwCount
              return {
                ...p,
                keywords: pageKeywordsMap[p.id] || []
              }
            })
            
            categories.push({ id: cat.id, name: cat.name, description: cat.description, pages: pagesWithKeywords })
          }
        }
        result.push({ id: silo.id, name: silo.name, description: silo.description, keywordCount: totalKeywords, categories })
      }
    }
    return NextResponse.json({ silos: result, debug: debugInfo })
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
    
    // Obtener categorías del silo
    const { data: categories } = await supabaseClient
      .from('d_seo_admin_categories')
      .select('id')
      .eq('silo_id', id)
    
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.id)
      
      // Obtener páginas de estas categorías
      const { data: pages } = await supabaseClient
        .from('d_seo_admin_pages')
        .select('id')
        .in('category_id', categoryIds)
      
      if (pages && pages.length > 0) {
        const pageIds = pages.map(p => p.id)
        
        // Eliminar keyword_assignments de estas páginas
        await supabaseClient
          .from('d_seo_admin_keyword_assignments')
          .delete()
          .in('page_id', pageIds)
        
        // Obtener keyword_ids para pasarlos a pending (ya que se eliminaron los assignments)
        const { data: deletedAssignments } = await supabaseClient
          .from('d_seo_admin_keyword_assignments')
          .select('keyword_id')
          .in('page_id', pageIds)
        
        // Pasar keywords a pending
        if (deletedAssignments && deletedAssignments.length > 0) {
          const keywordIds = deletedAssignments.map((a: any) => a.keyword_id).filter(Boolean)
          if (keywordIds.length > 0) {
            await supabaseClient
              .from('d_seo_admin_raw_keywords')
              .update({ status: 'pending' })
              .in('id', keywordIds)
          }
        }
        
        // Eliminar páginas
        await supabaseClient
          .from('d_seo_admin_pages')
          .delete()
          .in('category_id', categoryIds)
      }
      
      // Eliminar categorías
      await supabaseClient
        .from('d_seo_admin_categories')
        .delete()
        .in('id', categoryIds)
    }
    
    // Ahora eliminar el silo
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
