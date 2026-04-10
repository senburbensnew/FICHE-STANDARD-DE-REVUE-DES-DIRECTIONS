/**
 * Utilitaire d'envoi d'emails via Nodemailer (SMTP).
 * Configuration via variables d'environnement :
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@mef.ht'

/**
 * Envoie un email.
 * @param {{ to: string|string[], subject: string, html: string }} opts
 */
async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[mailer] SMTP non configuré — email non envoyé :', subject)
    return
  }
  const recipients = Array.isArray(to) ? to.join(', ') : to
  await transporter.sendMail({ from: FROM, to: recipients, subject, html })
}

/**
 * Récupère tous les emails des utilisateurs Keycloak (non nuls, activés).
 */
async function getAllUserEmails() {
  const KC_URL   = process.env.KEYCLOAK_URL   || 'http://keycloak:8180'
  const KC_REALM = process.env.KEYCLOAK_REALM || 'mef'
  const KC_ADMIN = process.env.KC_ADMIN       || 'admin'
  const KC_PASS  = process.env.KC_ADMIN_PASS  || 'admin'

  try {
    const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id:  'admin-cli',
        username:   KC_ADMIN,
        password:   KC_PASS,
      }),
    })
    if (!tokenRes.ok) throw new Error(`Keycloak admin auth failed: ${tokenRes.status}`)
    const { access_token } = await tokenRes.json()

    const usersRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users?max=500`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!usersRes.ok) throw new Error(`Keycloak users fetch failed: ${usersRes.status}`)
    const users = await usersRes.json()

    return users
      .filter(u => u.enabled !== false && u.email)
      .map(u => u.email)
  } catch (err) {
    console.error('[mailer] Impossible de récupérer les emails Keycloak :', err.message)
    return []
  }
}

module.exports = { sendMail, getAllUserEmails }
