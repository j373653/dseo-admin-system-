import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Obtener proveedores activos
    const { data: providers } = await supabase
      .from('d_seo_admin_ai_providers')
      .select('*')
      .eq('active', true)
      .order('is_default', { ascending: false })
    
    // Obtener modelos con info de provider
    const { data: models } = await supabase
      .from('d_seo_admin_ai_models')
      .select(`
        *,
        provider:provider_id (
          name,
          provider,
          api_key_env_var
        )
      `)
      .order('display_name')
    
    // Obtener configuración por tarea
    const { data: taskConfig } = await supabase
      .from('d_seo_admin_ai_task_config')
      .select(`
        *,
        model:model_id (
          model_id,
          display_name
        )
      `)
      .eq('is_default', true)
    
    // Agrupar modelos por provider
    const modelsByProvider: Record<string, any[]> = {}
    for (const model of (models || [])) {
      const providerName = model.provider?.name || 'Unknown'
      if (!modelsByProvider[providerName]) {
        modelsByProvider[providerName] = []
      }
      modelsByProvider[providerName].push({
        id: model.id,
        modelId: model.model_id,
        displayName: model.display_name,
        parameters: model.parameters,
        provider: model.provider?.provider,
        apiKeyEnvVar: model.provider?.api_key_env_var
      })
    }
    
    // Agrupar por tarea
    const modelsByTask: Record<string, any[]> = {}
    for (const model of (models || [])) {
      const task = model.task || 'silo' // Default task
      if (!modelsByTask[task]) {
        modelsByTask[task] = []
      }
      modelsByTask[task].push({
        id: model.id,
        modelId: model.model_id,
        displayName: model.display_name,
        provider: model.provider?.provider,
        providerName: model.provider?.name
      })
    }
    
    return NextResponse.json({
      success: true,
      providers: providers || [],
      modelsByProvider,
      modelsByTask,
      taskConfig: taskConfig || []
    })
  } catch (error: any) {
    console.error('Error in ai-models:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Actualizar modelo por defecto para una tarea
export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { task, modelId } = body
    
    if (!task || !modelId) {
      return NextResponse.json({ error: 'task y modelId requeridos' }, { status: 400 })
    }
    
    // Quitar is_default de otros modelos de esta tarea
    await supabase
      .from('d_seo_admin_ai_task_config')
      .update({ is_default: false })
      .eq('task', task)
    
    // Actualizar o insertar el nuevo modelo por defecto
    const { data: existing } = await supabase
      .from('d_seo_admin_ai_task_config')
      .select('id')
      .eq('task', task)
      .single()
    
    if (existing) {
      await supabase
        .from('d_seo_admin_ai_task_config')
        .update({ model_id: modelId, is_default: true })
        .eq('task', task)
    } else {
      await supabase
        .from('d_seo_admin_ai_task_config')
        .insert({ task, model_id: modelId, is_default: true })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating task config:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
