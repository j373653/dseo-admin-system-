import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const supabase = getSupabaseAdmin()

  try {
    // Obtener todas las keywords con más de una asignación
    const { data: keywordsWithMultiple, error: queryError } = await supabase
      .rpc('get_duplicate_keywords')

    if (queryError) {
      console.log('RPC no existe, usando query manual')
    }

    // Query manual para encontrar duplicados
    const { data: allAssignments, error: fetchError } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .select('id, keyword_id, page_id, assigned_at')
      .order('assigned_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Agrupar por keyword_id
    const keywordMap = new Map()
    allAssignments?.forEach((row) => {
      if (!keywordMap.has(row.keyword_id)) {
        keywordMap.set(row.keyword_id, [])
      }
      keywordMap.get(row.keyword_id).push(row)
    })

    // Encontrar IDs a eliminar (mantener solo el más reciente)
    const idsToRemove: string[] = []
    let duplicatesFound = 0

    keywordMap.forEach((assignments) => {
      if (assignments.length > 1) {
        duplicatesFound += assignments.length - 1
        // Eliminar todos menos el primero (el más reciente)
        for (let i = 1; i < assignments.length; i++) {
          idsToRemove.push(assignments[i].id)
        }
      }
    })

    if (idsToRemove.length === 0) {
      return NextResponse.json({
        message: 'No hay duplicados para eliminar',
        duplicatesFound: 0,
        removed: 0
      })
    }

    // Eliminar en batches de 100
    const batchSize = 100
    let totalRemoved = 0
    
    for (let i = 0; i < idsToRemove.length; i += batchSize) {
      const batch = idsToRemove.slice(i, i + batchSize)
      const { error: deleteError } = await supabase
        .from('d_seo_admin_keyword_assignments')
        .delete()
        .in('id', batch)

      if (deleteError) {
        console.error('Error deleting batch:', deleteError)
      } else {
        totalRemoved += batch.length
      }
    }

    return NextResponse.json({
      message: 'Deduplicación completada',
      duplicatesFound,
      removed: totalRemoved
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
