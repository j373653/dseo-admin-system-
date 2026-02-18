// API Client para n8n
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_URL || 'https://n8n.keepmyweb.com/webhook'

export async function getLeadsFromN8n() {
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/get-leads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data: Array.isArray(data) ? data : [] }
  } catch (error: any) {
    console.error('Error fetching leads from n8n:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function createLeadInN8n(lead: any) {
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/new-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error creating lead in n8n:', error)
    return { success: false, error: error.message }
  }
}
