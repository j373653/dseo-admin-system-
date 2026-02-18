import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendLeadNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar campos requeridos
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Preparar datos del lead
    const leadData = {
      email: body.email,
      name: body.name || null,
      company: body.company || null,
      phone: body.phone || null,
      source: body.source || 'website',
      landing_page: body.landing_page || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      message: body.message || null,
      status: 'new',
      lead_score: body.lead_score || 0
    }

    // Insertar lead en Supabase
    const { data, error } = await supabaseAdmin
      .from('d_seo_admin_leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Enviar email de notificación
    try {
      await sendLeadNotification(data)
    } catch (emailError) {
      console.error('Email error:', emailError)
      // No fallamos si el email no se envía
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead received successfully',
        leadId: data?.id 
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Permitir CORS para recibir leads desde cualquier origen
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
