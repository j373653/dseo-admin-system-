import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabase'

// GET: fetch categories for a given silo with their pages
export async function GET(req: NextRequest) {
  try {
    const siloId = req.nextUrl.searchParams.get('silo_id') || ''
    if (!siloId) {
      // try from path param (dynamic routes would provide param in params, but we fallback)
      return NextResponse.json({ error: 'silo_id is required' }, { status: 400 })
    }
    const { data: categories } = await supabaseClient
      .from('d_seo_admin_categories')
      .select('id, name, description')
      .eq('silo_id', siloId)

    const result = [] as any[]
    for (const cat of categories || []) {
      const { data: pages } = await supabaseClient
        .from('d_seo_admin_pages')
        .select('id, main_keyword, url_target, is_pillar, content_type_target, pillar_data')
        .eq('category_id', cat.id)
      result.push({ id: cat.id, name: cat.name, description: cat.description, pages: pages || [] })
    }
    return NextResponse.json({ categories: result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error fetching categories' }, { status: 500 })
  }
}

// POST: create a new category under a silo
export async function POST(req: NextRequest) {
  try {
    const { silo_id, name, description } = await req.json()
    if (!silo_id || !name) throw new Error('silo_id and name are required')
    const { data } = await supabaseClient
      .from('d_seo_admin_categories')
      .insert({ silo_id, name, description })
      .select()
      .single()
    return NextResponse.json({ category: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
