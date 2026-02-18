// Cliente Supabase API REST para schema public
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.keepmyweb.com'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface Lead {
  id: string
  email: string
  name?: string
  company?: string
  phone?: string
  source?: string
  landing_page?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  status?: string
  lead_score?: number
  created_at?: string
}

export async function getLeadsFromSupabase(): Promise<{ success: boolean; data: Lead[]; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_leads?select=*&order=created_at.desc&limit=100`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching leads from Supabase:', error)
    return { success: false, data: [], error: error.message }
  }
}

export async function createLeadInSupabase(lead: Partial<Lead>): Promise<{ success: boolean; data?: Lead; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/d_seo_admin_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(lead)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return { success: true, data: data[0] }
  } catch (error: any) {
    console.error('Error creating lead in Supabase:', error)
    return { success: false, error: error.message }
  }
}
