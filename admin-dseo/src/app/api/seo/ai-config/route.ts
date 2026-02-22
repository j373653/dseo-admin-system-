import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { data, error } = await supabase
      .from('d_seo_admin_ai_config')
      .select('id, task, model, parameters, active, created_at, updated_at')
      .order('task')

    if (error) throw error

    const config: { [key: string]: any } = {}
    for (const item of data || []) {
      config[item.task] = {
        model: item.model,
        parameters: item.parameters,
        active: item.active
      }
    }

    return NextResponse.json({
      success: true,
      config,
      all: data
    })
  } catch (error: any) {
    console.error('Error fetching AI config:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const body = await request.json()
    const { task, model, parameters, active } = body

    if (!task || !model) {
      return NextResponse.json({ error: 'Se requiere task y model' }, { status: 400 })
    }

    const updateData: any = {
      model,
      updated_at: new Date().toISOString()
    }

    if (parameters !== undefined) {
      updateData.parameters = parameters
    }
    if (active !== undefined) {
      updateData.active = active
    }

    const { data, error } = await supabase
      .from('d_seo_admin_ai_config')
      .update(updateData)
      .eq('task', task)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, task, model, parameters: data.parameters })
  } catch (error: any) {
    console.error('Error updating AI config:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
