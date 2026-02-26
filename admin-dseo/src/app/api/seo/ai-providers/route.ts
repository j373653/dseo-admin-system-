import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// GET - Listar proveedores y modelos
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Obtener proveedores activos
    const { data: providers } = await supabase
      .from('d_seo_admin_ai_providers')
      .select('*')
      .eq('active', true)
      .order('name')
    
    // Obtener modelos
    const { data: models } = await supabase
      .from('d_seo_admin_ai_models')
      .select('*')
      .order('display_name')
    
    // Obtener configuración por tarea
    const { data: taskConfig } = await supabase
      .from('d_seo_admin_ai_task_config')
      .select('*')
      .eq('is_default', true)
    
    return NextResponse.json({
      providers: providers || [],
      models: models || [],
      taskConfig: taskConfig || []
    })
  } catch (error: any) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Crear proveedor
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { name, provider, api_key_env_var } = body
    
    if (!name || !provider || !api_key_env_var) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('d_seo_admin_ai_providers')
      .insert({ name, provider, api_key_env_var })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, provider: data })
  } catch (error: any) {
    console.error('Error creating provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Actualizar proveedor
export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { id, name, active, is_default } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (active !== undefined) updateData.active = active
    if (is_default !== undefined) updateData.is_default = is_default
    
    const { data, error } = await supabase
      .from('d_seo_admin_ai_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, provider: data })
  } catch (error: any) {
    console.error('Error updating provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('d_seo_admin_ai_providers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
