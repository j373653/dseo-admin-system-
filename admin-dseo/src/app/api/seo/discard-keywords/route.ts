import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { keywordIds } = await request.json()

    if (!keywordIds || keywordIds.length === 0) {
      return NextResponse.json({ error: 'No hay keywords para descartar' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('d_seo_admin_raw_keywords')
      .update({
        status: 'discarded',
        discarded_at: new Date().toISOString(),
        discarded_reason: 'No coincide con ningún servicio de d-seo.es'
      })
      .in('id', keywordIds)

    if (error) {
      console.error('Error discarding keywords:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: keywordIds.length })
  } catch (err: any) {
    console.error('Error in discard-keywords:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
