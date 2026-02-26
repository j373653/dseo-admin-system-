import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = supabase
      .from('d_seo_admin_silo_proposals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    // Limitar a 3
    query = query.limit(3)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching proposals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ proposals: data || [] })
  } catch (error: any) {
    console.error('Error in proposals GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { proposal, intentions, discardSelected, keywordsCount, name } = body
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal es requerido' }, { status: 400 })
    }
    
    // Generar nombre automático
    const proposalName = name || `Propuesta ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`
    
    // Contar propuestas existentes
    const { count } = await supabase
      .from('d_seo_admin_silo_proposals')
      .select('*', { count: 'exact', head: true })
    
    // Si hay más de 3, eliminar la más antigua
    if (count && count >= 3) {
      const { data: oldest } = await supabase
        .from('d_seo_admin_silo_proposals')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (oldest) {
        await supabase
          .from('d_seo_admin_silo_proposals')
          .delete()
          .eq('id', oldest.id)
      }
    }
    
    // Insertar nueva propuesta
    const { data, error } = await supabase
      .from('d_seo_admin_silo_proposals')
      .insert({
        name: proposalName,
        proposal,
        intentions: intentions || {},
        discard_selected: discardSelected || [],
        keywords_count: keywordsCount || 0,
        status: 'draft'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving proposal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, proposal: data })
  } catch (error: any) {
    console.error('Error in proposals POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('d_seo_admin_silo_proposals')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting proposal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in proposals DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
