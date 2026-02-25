import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const results = {
      orphanedAssignmentsDeleted: 0,
      keywordsReactivated: 0,
      pagesDeleted: 0,
      errors: [] as string[]
    }

    // Get all data to analyze relationships
    const { data: allAssignments } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .select('id, keyword_id, page_id')

    const { data: allPages } = await supabase
      .from('d_seo_admin_pages')
      .select('id, category_id')

    const { data: allCategories } = await supabase
      .from('d_seo_admin_categories')
      .select('id, silo_id')

    const { data: allSilos } = await supabase
      .from('d_seo_admin_silos')
      .select('id')

    // Build sets for fast lookup
    const pageIds = new Set(allPages?.map(p => p.id) || [])
    const categoryIds = new Set(allCategories?.map(c => c.id) || [])
    const siloIds = new Set(allSilos?.map(s => s.id) || [])
    
    // Create category_id -> silo_id map
    const categoryToSilo = new Map<string, string>()
    for (const cat of (allCategories || [])) {
      categoryToSilo.set(cat.id, cat.silo_id)
    }

    // Create page_id -> category_id map
    const pageToCategory = new Map<string, string>()
    for (const page of (allPages || [])) {
      pageToCategory.set(page.id, page.category_id)
    }

    // SCENARIO 1: Find assignments to pages whose category's silo doesn't exist
    const orphanedByDeletedSilo: string[] = []
    const orphanedByDeletedCategory: string[] = []
    const orphanedPageIds: string[] = []

    for (const assignment of (allAssignments || [])) {
      if (!assignment.page_id) continue
      
      const categoryId = pageToCategory.get(assignment.page_id)
      if (!categoryId) {
        orphanedByDeletedCategory.push(assignment.id)
        if (!orphanedPageIds.includes(assignment.page_id)) {
          orphanedPageIds.push(assignment.page_id)
        }
        continue
      }
      
      const siloId = categoryToSilo.get(categoryId)
      if (!siloId || !siloIds.has(siloId)) {
        orphanedByDeletedSilo.push(assignment.id)
        if (!orphanedPageIds.includes(assignment.page_id)) {
          orphanedPageIds.push(assignment.page_id)
        }
      }
    }

    // Delete orphaned assignments and their pages
    const allOrphanedAssignmentIds = [...orphanedByDeletedSilo, ...orphanedByDeletedCategory]
    const uniqueOrphanedAssignmentIds = [...new Set(allOrphanedAssignmentIds)]
    
    if (uniqueOrphanedAssignmentIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('d_seo_admin_keyword_assignments')
        .delete()
        .in('id', uniqueOrphanedAssignmentIds)
      
      if (deleteError) {
        results.errors.push(`Error deleting orphaned assignments: ${deleteError.message}`)
      } else {
        results.orphanedAssignmentsDeleted = uniqueOrphanedAssignmentIds.length
      }
    }

    // Delete orphaned pages
    if (orphanedPageIds.length > 0) {
      const { error: pageDeleteError } = await supabase
        .from('d_seo_admin_pages')
        .delete()
        .in('id', orphanedPageIds)
      
      if (!pageDeleteError) {
        results.pagesDeleted = orphanedPageIds.length
      }
    }

    // Get unique keyword IDs from deleted assignments
    const keywordIdsFromOrphaned = [...new Set(
      (allAssignments || [])
        .filter(a => uniqueOrphanedAssignmentIds.includes(a.id))
        .map(a => a.keyword_id)
        .filter(Boolean)
    )]

    // SCENARIO 2: Find keywords in 'clustered' status whose page's category has no silo
    const { data: clusteredKeywords } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('id')
      .eq('status', 'clustered')

    const assignedKeywordIds = new Set(
      (allAssignments || [])
        .map(a => a.keyword_id)
        .filter(Boolean)
    )

    // Keywords clustered but not in any assignment
    const clusteredWithoutAssignment = (clusteredKeywords || []).filter(
      kw => !assignedKeywordIds.has(kw.id)
    ).map(kw => kw.id)

    const allKeywordIdsToReactivate = [
      ...keywordIdsFromOrphaned,
      ...clusteredWithoutAssignment
    ]
    const uniqueKeywordIdsToReactivate = [...new Set(allKeywordIdsToReactivate)]

    if (uniqueKeywordIdsToReactivate.length > 0) {
      const { error: updateError } = await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('id', uniqueKeywordIdsToReactivate)
      
      if (updateError) {
        results.errors.push(`Error reactivating keywords: ${updateError.message}`)
      } else {
        results.keywordsReactivated = uniqueKeywordIdsToReactivate.length
      }
    }

    // Get current counts
    const { count: pendingCount } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: clusteredCount } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'clustered')

    return NextResponse.json({
      success: true,
      results,
      counts: {
        pending: pendingCount || 0,
        clustered: clusteredCount || 0
      }
    })

  } catch (error: any) {
    console.error('Error in cleanup-orphaned:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
