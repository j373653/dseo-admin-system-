import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'supabase-db', // En Coolify usar nombre del servicio
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function getLeads() {
  const result = await query(
    'SELECT * FROM dseo_admin.leads ORDER BY created_at DESC LIMIT 50'
  )
  return result.rows
}

export async function insertLead(lead: any) {
  const result = await query(
    `INSERT INTO dseo_admin.leads 
     (email, name, company, phone, source, landing_page, utm_source, utm_medium, utm_campaign, utm_content, message, status, lead_score) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
     RETURNING *`,
    [
      lead.email,
      lead.name || null,
      lead.company || null,
      lead.phone || null,
      lead.source || 'website',
      lead.landing_page || null,
      lead.utm_source || null,
      lead.utm_medium || null,
      lead.utm_campaign || null,
      lead.utm_content || null,
      lead.message || null,
      'new',
      lead.lead_score || 0
    ]
  )
  return result.rows[0]
}
