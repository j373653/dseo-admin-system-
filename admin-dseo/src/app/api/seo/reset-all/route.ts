import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Verificar que es una acción intencional
    const { confirm } = await request.json()
    if (confirm !== 'RESET_ALL') {
      return NextResponse.json({ 
        error: 'Debes confirmar con confirm: "RESET_ALL"' 
      }, { status: 400 })
    }

    const results = {
      assignmentsDeleted: 0,
      pagesDeleted: 0,
      categoriesDeleted: 0,
      silosDeleted: 0,
      keywordsReactivated: 0
    }

    // 1. Obtener todos los keyword_ids de assignments antes de borrar
    const { data: allAssignments } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .select('keyword_id')

    const uniqueKeywordIds = [...new Set(
      (allAssignments || [])
        .map(a => a.keyword_id)
        .filter(Boolean)
    )]

    // 2. Eliminar keyword_assignments
    const { error: deleteAssignmentsError } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteAssignmentsError) {
      return NextResponse.json({ error: deleteAssignmentsError.message }, { status: 500 })
    }
    results.assignmentsDeleted = allAssignments?.length || 0

    // 3. Eliminar páginas
    const { data: pages } = await supabase
      .from('d_seo_admin_pages')
      .select('id')
    
    if (pages && pages.length > 0) {
      const pageIds = pages.map(p => p.id)
      await supabase.from('d_seo_admin_pages').delete().in('id', pageIds)
      results.pagesDeleted = pageIds.length
    }

    // 4. Eliminar categorías
    const { data: categories } = await supabase
      .from('d_seo_admin_categories')
      .select('id')
    
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.id)
      await supabase.from('d_seo_admin_categories').delete().in('id', categoryIds)
      results.categoriesDeleted = categoryIds.length
    }

    // 5. Eliminar silos
    const { data: silos } = await supabase
      .from('d_seo_admin_silos')
      .select('id')
    
    if (silos && silos.length > 0) {
      const siloIds = silos.map(s => s.id)
      await supabase.from('d_seo_admin_silos').delete().in('id', siloIds)
      results.silosDeleted = siloIds.length
    }

    // 6. Reactivar todas las keywords clustered a pending
    if (uniqueKeywordIds.length > 0) {
      await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('id', uniqueKeywordIds)
      results.keywordsReactivated = uniqueKeywordIds.length
    }

    // También las que estaban en clustered sin assignment
    await supabase
      .from('d_seo_admin_raw_keywords')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'clustered')

    return NextResponse.json({
      success: true,
      results,
      message: 'Todo eliminado. Keywords reactivadas a pending.'
    })

  } catch (error: any) {
    console.error('Error in reset-all:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
