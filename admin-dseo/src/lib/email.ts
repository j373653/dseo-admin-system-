import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.d-seo.es',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'web@d-seo.es',
    pass: process.env.SMTP_PASSWORD || '',
  },
})

export async function sendLeadNotification(lead: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'web@d-seo.es',
    to: 'web@d-seo.es',
    subject: `🎯 Nuevo Lead: ${lead.email}`,
    text: `
🎯 NUEVO LEAD RECIBIDO

📧 Email: ${lead.email}
👤 Nombre: ${lead.name || 'No especificado'}
🏢 Empresa: ${lead.company || 'No especificada'}

🌐 Fuente: ${lead.source || 'website'}
📄 Landing: ${lead.landing_page || 'No especificada'}

📍 UTM:
- Source: ${lead.utm_source || 'N/A'}
- Medium: ${lead.utm_medium || 'N/A'}
- Campaign: ${lead.utm_campaign || 'N/A'}

📝 Mensaje: ${lead.message || 'Sin mensaje'}

⏰ Recibido: ${new Date().toLocaleString()}
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
