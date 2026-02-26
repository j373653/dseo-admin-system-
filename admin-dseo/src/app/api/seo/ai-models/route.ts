import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { data, error } = await supabase
      .from('d_seo_admin_ai_config')
      .select('task, model, parameters, active')
      .eq('active', true)
      .order('task')
    
    if (error) {
      console.error('Error fetching AI config:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Añadir Gemini 3 Flash como opción adicional
    const models = [
      ...(data || []).map(item => ({
        task: item.task,
        model: item.model,
        parameters: item.parameters || {},
        provider: item.model.includes('/') || item.model.includes(':free') ? 'openrouter' : 'google'
      })),
      // Añadir Gemini 3 Flash como opción fija
      {
        task: 'silo',
        model: 'gemini-3-flash',
        parameters: { maxTokens: 20000, temperature: 0.3 },
        provider: 'google',
        isNew: true
      }
    ]

    // Agrupar por tarea
    const grouped = models.reduce((acc: any, item) => {
      if (!acc[item.task]) {
        acc[item.task] = []
      }
      acc[item.task].push(item)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      models: grouped,
      allModels: models
    })
  } catch (error: any) {
    console.error('Error in ai-models:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
