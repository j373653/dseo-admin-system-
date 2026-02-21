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
