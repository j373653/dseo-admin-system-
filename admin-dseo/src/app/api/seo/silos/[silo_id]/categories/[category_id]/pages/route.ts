import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabase'

// GET: fetch pages for a category
export async function GET(req: NextRequest) {
  try {
    // Try to read path params (Next 13 dynamic routes would pass via params, but here we fallback to query)
    const silo_id = req.nextUrl.searchParams.get('silo_id')
    const category_id = req.nextUrl.searchParams.get('category_id')
    if (!category_id) throw new Error('category_id is required')
    const { data: pages } = await supabaseClient
      .from('d_seo_admin_pages')
      .select('id, main_keyword, url_target, is_pillar, content_type_target, pillar_data')
      .eq('category_id', category_id)
    return NextResponse.json({ pages })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error fetching pages' }, { status: 500 })
  }
}

// POST: create a page under a category
export async function POST(req: NextRequest) {
  try {
    const { category_id, main_keyword, url_target, is_pillar, content_type_target, notes } = await req.json()
    if (!category_id || !main_keyword) throw new Error('category_id and main_keyword are required')
    const { data } = await supabaseClient
      .from('d_seo_admin_pages')
      .insert({ category_id, silo_id: null, main_keyword, url_target, is_pillar, content_type_target, notes })
      .select()
      .single()
    return NextResponse.json({ page: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error creating page' }, { status: 400 })
  }
}

// DELETE: delete a page
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    
    // Primero, obtener las keywords asignadas a esta página
    const { data: assignments } = await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .select('keyword_id')
      .eq('page_id', id)
    
    // Eliminar las asignaciones de keywords
    await supabaseClient
      .from('d_seo_admin_keyword_assignments')
      .delete()
      .eq('page_id', id)
    
    // Pasar las keywords a pending
    if (assignments && assignments.length > 0) {
      const keywordIds = assignments.map((a: any) => a.keyword_id).filter(Boolean)
      if (keywordIds.length > 0) {
        await supabaseClient
          .from('d_seo_admin_raw_keywords')
          .update({ status: 'pending' })
          .in('id', keywordIds)
      }
    }
    
    // Ahora eliminar la página
    const { error } = await supabaseClient.from('d_seo_admin_pages').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH: update a page
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    
    const body = await req.json()
    const { main_keyword, url_target, is_pillar, content_type_target, notes } = body
    
    const { data, error } = await supabaseClient
      .from('d_seo_admin_pages')
      .update({ main_keyword, url_target, is_pillar, content_type_target, notes })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return NextResponse.json({ page: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
