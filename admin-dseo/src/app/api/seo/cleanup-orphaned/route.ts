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
      errors: [] as string[]
    }

    // 1. Find keyword assignments where page_id no longer exists
    const { data: orphanedAssignments, error: findError } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .select('id, keyword_id')
      .in(
        'page_id',
        supabase.from('d_seo_admin_pages').select('id').then(({ data }) => data?.map(p => p.id) || [])
      )

    if (findError) {
      console.error('Error finding orphaned assignments:', findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    // Get all assignments and filter in memory
    const { data: allAssignments } = await supabase
      .from('d_seo_admin_keyword_assignments')
      .select('id, keyword_id, page_id')

    const { data: allPages } = await supabase
      .from('d_seo_admin_pages')
      .select('id')

    const pageIds = new Set(allPages?.map(p => p.id) || [])
    
    // Find orphaned assignments (where page_id doesn't exist)
    const orphaned = (allAssignments || []).filter(a => !a.page_id || !pageIds.has(a.page_id))
    const orphanedIds = orphaned.map(a => a.id)
    const keywordIdsFromOrphaned = [...new Set(orphaned.map(a => a.keyword_id).filter(Boolean))]

    if (orphanedIds.length > 0) {
      // Delete orphaned assignments
      const { error: deleteError } = await supabase
        .from('d_seo_admin_keyword_assignments')
        .delete()
        .in('id', orphanedIds)
      
      if (deleteError) {
        results.errors.push(`Error deleting orphaned assignments: ${deleteError.message}`)
      } else {
        results.orphanedAssignmentsDeleted = orphanedIds.length
      }
    }

    // 2. Find keywords in 'clustered' status with no valid assignments
    const { data: clusteredKeywords } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('id')
      .eq('status', 'clustered')

    const assignedKeywordIds = new Set((allAssignments || []).map(a => a.keyword_id).filter(Boolean))
    
    const needsReactivation = (clusteredKeywords || []).filter(
      kw => !assignedKeywordIds.has(kw.id)
    ).map(kw => kw.id)

    if (needsReactivation.length > 0) {
      // Update these keywords to pending
      const { error: updateError } = await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('id', needsReactivation)
      
      if (updateError) {
        results.errors.push(`Error reactivating keywords: ${updateError.message}`)
      } else {
        results.keywordsReactivated = needsReactivation.length
      }
    }

    // Also reactivate from the orphaned assignments we just deleted
    if (keywordIdsFromOrphaned.length > 0) {
      const { error: updateError2 } = await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('id', keywordIdsFromOrphaned)
      
      if (!updateError2) {
        results.keywordsReactivated += keywordIdsFromOrphaned.length
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
