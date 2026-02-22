import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { supabaseClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get('page_id')
    const unassigned = searchParams.get('unassigned')
    
    if (pageId) {
      // Fetch assignments with keyword_id manually
      const { data: assignments } = await supabaseClient
        .from('d_seo_admin_keyword_assignments')
        .select('id, page_id, keyword_id')
        .eq('page_id', pageId)
      
      if (!assignments || assignments.length === 0) {
        return NextResponse.json({ keywords: [] })
      }
      
      // Get keyword IDs
      const keywordIds = assignments.map(a => a.keyword_id).filter(Boolean)
      
      if (keywordIds.length === 0) {
        return NextResponse.json({ keywords: [] })
      }
      
      // Fetch keywords
      const { data: keywords } = await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, intent')
        .in('id', keywordIds)
      
      // Build result
      const keywordMap: { [id: string]: any } = {}
      if (keywords) {
        for (const kw of keywords) {
          keywordMap[kw.id] = kw
        }
      }
      
      const result = assignments
        .filter(a => a.keyword_id && keywordMap[a.keyword_id])
        .map(a => ({
          assignment_id: a.id,
          ...keywordMap[a.keyword_id]
        }))
      
      return NextResponse.json({ keywords: result })
    }
    
    if (unassigned === 'true') {
      const { data: assignedKeywordIds } = await supabaseClient
        .from('d_seo_admin_keyword_assignments')
        .select('keyword_id')
      
      const assignedIds = (assignedKeywordIds || []).map((a: any) => a.keyword_id).filter(Boolean)
      
      let query = supabaseClient
        .from('d_seo_admin_raw_keywords')
        .select('id, keyword, search_volume, intent, status')
        .in('status', ['pending', 'clustered'])
        .order('search_volume', { ascending: false })
        .limit(100)
      
      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`)
      }
      
      const { data: keywords } = await query
      
      return NextResponse.json({ keywords: keywords || [] })
    }
    
    return NextResponse.json({ error: 'page_id or unassigned required' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword_id, page_id } = await req.json()
    
    if (!keyword_id || !page_id) {
      return NextResponse.json({ error: 'keyword_id and page_id required' }, { status: 400 })
    }
    
    const { data, error } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .upsert({
        keyword_id,
        page_id,
        assigned_at: new Date().toISOString()
      }, { onConflict: 'keyword_id,page_id' })
      .select()
      .single()
    
    if (error) throw error
    
    await supabaseClient
      .from('d_seo_admin_raw_keywords')
      .update({ status: 'clustered' })
      .eq('id', keyword_id)
    
    return NextResponse.json({ assignment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')
    const keywordId = searchParams.get('keyword_id')
    
    if (assignmentId) {
      const { data: assignment } = await supabaseClient
        .from('d_seo_admin_keyword_assignments')
        .select('keyword_id')
        .eq('id', assignmentId)
        .single()
      
      if (assignment) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ status: 'pending' })
          .eq('id', assignment.keyword_id)
      }
      
      const { error } = await supabaseClient
        .from('d_seo_admin_keyword_assignments')
        .delete()
        .eq('id', assignmentId)
      
      if (error) throw error
    } else if (keywordId) {
      const { error } = await supabaseClient
        .from('d_seo_admin_keyword_assignments')
        .delete()
        .eq('keyword_id', keywordId)
      
      if (error) throw error
      
      await supabaseClient
        .from('d_seo_admin_raw_keywords')
        .update({ status: 'pending' })
        .eq('id', keywordId)
    } else {
      return NextResponse.json({ error: 'assignment_id or keyword_id required' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  }
}
