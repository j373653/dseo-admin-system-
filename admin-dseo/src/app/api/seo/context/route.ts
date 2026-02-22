import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { data, error } = await supabase
      .from('d_seo_admin_company_context')
      .select('key, value, updated_at')
      .order('key')

    if (error) throw error

    const context: { [key: string]: any } = {}
    for (const item of data || []) {
      context[item.key] = item.value
    }

    return NextResponse.json({
      success: true,
      context,
      lastUpdated: data?.[0]?.updated_at
    })
  } catch (error: any) {
    console.error('Error fetching context:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Se requiere key y value' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('d_seo_admin_company_context')
      .upsert({ 
        key, 
        value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, key, value })
  } catch (error: any) {
    console.error('Error updating context:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
