import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '2000')

    let query = supabase
      .from('d_seo_admin_raw_keywords')
      .select('id, keyword, search_volume, difficulty, status, intent, cluster_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      if (status === 'pending') {
        query = query.eq('status', 'pending')
      } else if (status === 'clustered') {
        query = query.eq('status', 'clustered')
      } else if (status === 'discarded') {
        query = query.eq('status', 'discarded')
      }
    }

    const { data, error } = await query

    if (error) throw error

    const { count } = await supabase
      .from('d_seo_admin_raw_keywords')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      keywords: data || [],
      total: count || 0,
      pending: (await supabase.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'pending')).count || 0,
      clustered: (await supabase.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'clustered')).count || 0,
      discarded: (await supabase.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'discarded')).count || 0
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { keywordIds, status, discarded_reason } = await request.json()

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de keywordIds' }, { status: 400 })
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
      
      if (status === 'discarded') {
        updateData.discarded_at = new Date().toISOString()
        updateData.discarded_reason = discarded_reason || 'Descartado manualmente'
      }
      
      if (status === 'pending') {
        updateData.cluster_id = null
        updateData.discarded_at = null
        updateData.discarded_reason = null
      }
    }

    const { data, error } = await supabase
      .from('d_seo_admin_raw_keywords')
      .update(updateData)
      .in('id', keywordIds)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
