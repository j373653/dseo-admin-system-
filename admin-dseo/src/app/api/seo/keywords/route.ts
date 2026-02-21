import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '500')

    let query = supabaseClient
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

    const { count } = await supabaseClient
      .from('d_seo_admin_raw_keywords')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      keywords: data || [],
      total: count || 0,
      pending: (await supabaseClient.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'pending')).count || 0,
      clustered: (await supabaseClient.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'clustered')).count || 0,
      discarded: (await supabaseClient.from('d_seo_admin_raw_keywords').select('*', { count: 'exact', head: true }).eq('status', 'discarded')).count || 0
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const { data, error } = await supabaseClient
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
