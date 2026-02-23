import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: Request) {
  try {
    const { keywordIds } = await request.json()

    if (!keywordIds || keywordIds.length === 0) {
      return NextResponse.json({ error: 'No hay keywords para descartar' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const chunkSize = 100
    let totalUpdated = 0

    for (let i = 0; i < keywordIds.length; i += chunkSize) {
      const chunk = keywordIds.slice(i, i + chunkSize)
      
      const { error } = await supabase
        .from('d_seo_admin_raw_keywords')
        .update({
          status: 'discarded',
          discarded_at: new Date().toISOString(),
          discarded_reason: 'No coincide con ningún servicio de d-seo.es'
        })
        .in('id', chunk)

      if (error) {
        console.error('Error discarding keywords:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      totalUpdated += chunk.length
    }

    return NextResponse.json({ success: true, count: totalUpdated })
  } catch (err: any) {
    console.error('Error in discard-keywords:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
