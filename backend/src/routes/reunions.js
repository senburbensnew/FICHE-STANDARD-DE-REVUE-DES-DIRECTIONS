/**
 * Routes /api/reunions
 * Gestion des réunions par la Direction Générale.
 * Envoie des notifications email à tous les utilisateurs à la création.
 */
const express = require('express')
const router  = express.Router()
const { Reunion } = require('../models/index')
const { audit }   = require('../auditLogger')
const { sendMail, getAllUserEmails } = require('../utils/mailer')

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  return `${d}/${m}/${y}`
}

function reunionEmailHtml(reunion, type = 'creation') {
  const dateStr  = fmtDate(reunion.date_reunion)
  const periodeStr = reunion.periode_debut
    ? `${fmtDate(reunion.periode_debut)} → ${fmtDate(reunion.periode_fin)}`
    : ''

  const subjectLine = type === 'rappel_7j'
    ? `Rappel — Réunion dans 7 jours : ${reunion.titre}`
    : type === 'rappel_1j'
    ? `Rappel — Réunion demain : ${reunion.titre}`
    : `Nouvelle réunion planifiée : ${reunion.titre}`

  const intro = type === 'creation'
    ? 'Une nouvelle réunion a été planifiée par la Direction Générale.'
    : type === 'rappel_7j'
    ? 'Rappel : une réunion est prévue dans <strong>7 jours</strong>.'
    : 'Rappel : une réunion est prévue <strong>demain</strong>.'

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#1e3a5f;color:#fff;padding:20px 24px">
      <p style="margin:0;font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">
        Ministère de l'Économie et des Finances
      </p>
      <h2 style="margin:6px 0 0;font-size:18px">${subjectLine}</h2>
    </div>
    <div style="padding:24px;background:#fff">
      <p style="color:#374151;margin-top:0">${intro}</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px;width:35%">Titre</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${reunion.titre}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px">Date</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${dateStr}</td>
        </tr>
        ${reunion.heure_debut ? `
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px">Heure</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${reunion.heure_debut}${reunion.heure_fin ? ` – ${reunion.heure_fin}` : ''}</td>
        </tr>` : ''}
        ${reunion.lieu ? `
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px">Lieu</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${reunion.lieu}</td>
        </tr>` : ''}
        ${periodeStr ? `
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px">Période concernée</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${periodeStr}</td>
        </tr>` : ''}
        ${reunion.description ? `
        <tr>
          <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#6b7280;font-size:13px">Description</td>
          <td style="padding:8px 12px;font-size:14px;color:#111827">${reunion.description}</td>
        </tr>` : ''}
      </table>
    </div>
    <div style="background:#f3f4f6;padding:12px 24px;font-size:11px;color:#9ca3af;text-align:center">
      Ce message est généré automatiquement — Fiche Standard de Revue des Directions, MEF
    </div>
  </div>`
}

// ─── GET /api/reunions ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { annee, annulee } = req.query
    const where = {}
    if (annee)   where.date_reunion = { $gte: `${annee}-01-01`, $lte: `${annee}-12-31` }
    if (annulee !== undefined) where.est_annulee = annulee === 'true'

    const reunions = await Reunion.findAll({
      where,
      order: [['date_reunion', 'ASC']],
    })
    res.json(reunions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/reunions/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const r = await Reunion.findByPk(req.params.id)
    if (!r) return res.status(404).json({ message: 'Réunion introuvable' })
    res.json(r)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/reunions ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { titre, description, date_reunion, heure_debut, heure_fin,
            lieu, periode_debut, periode_fin, creee_par } = req.body

    if (!titre || !date_reunion) {
      return res.status(400).json({ message: 'titre et date_reunion sont obligatoires.' })
    }

    const reunion = await Reunion.create({
      titre, description, date_reunion, heure_debut, heure_fin,
      lieu, periode_debut, periode_fin, creee_par,
    })

    await audit({
      action: 'CREATE', entity_type: 'reunion',
      entity_id: reunion.reunion_id, entity_label: titre, req,
    })

    // Notify all users asynchronously (don't block the response)
    getAllUserEmails().then(emails => {
      if (!emails.length) return
      const subject = `Nouvelle réunion planifiée : ${titre}`
      const html = reunionEmailHtml(reunion.toJSON(), 'creation')
      return sendMail({ to: emails, subject, html })
    }).catch(err => console.error('[reunions] Erreur envoi email création :', err.message))

    res.status(201).json(reunion)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── PUT /api/reunions/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const reunion = await Reunion.findByPk(req.params.id)
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' })

    const { titre, description, date_reunion, heure_debut, heure_fin,
            lieu, periode_debut, periode_fin } = req.body

    await reunion.update({ titre, description, date_reunion, heure_debut, heure_fin,
                           lieu, periode_debut, periode_fin })

    await audit({
      action: 'UPDATE', entity_type: 'reunion',
      entity_id: reunion.reunion_id, entity_label: reunion.titre, req,
    })

    res.json(reunion)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── PATCH /api/reunions/:id/annuler ─────────────────────────────────────────
router.patch('/:id/annuler', async (req, res) => {
  try {
    const reunion = await Reunion.findByPk(req.params.id)
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' })

    await reunion.update({ est_annulee: true })
    await audit({
      action: 'UPDATE', entity_type: 'reunion',
      entity_id: reunion.reunion_id, entity_label: `${reunion.titre} [ANNULÉE]`, req,
    })
    res.json({ message: 'Réunion annulée.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── DELETE /api/reunions/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const reunion = await Reunion.findByPk(req.params.id)
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' })
    await reunion.destroy()
    await audit({
      action: 'DELETE', entity_type: 'reunion',
      entity_id: req.params.id, entity_label: reunion.titre, req,
    })
    res.json({ message: 'Réunion supprimée.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * Envoi des rappels — appelé par le cron dans server.js.
 * Envoie un rappel 7 jours avant et 1 jour avant chaque réunion non annulée.
 */
async function sendReminders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const in7 = new Date(today); in7.setDate(today.getDate() + 7)
  const in1 = new Date(today); in1.setDate(today.getDate() + 1)

  const toISO = (d) => d.toISOString().split('T')[0]

  const targets = [
    { date: toISO(in7), type: 'rappel_7j' },
    { date: toISO(in1), type: 'rappel_1j' },
  ]

  for (const { date, type } of targets) {
    const reunions = await Reunion.findAll({
      where: { date_reunion: date, est_annulee: false },
    })
    for (const r of reunions) {
      const emails = await getAllUserEmails()
      if (!emails.length) continue
      const label   = type === 'rappel_7j' ? 'dans 7 jours' : 'demain'
      const subject = `Rappel — Réunion ${label} : ${r.titre}`
      const html    = reunionEmailHtml(r.toJSON(), type)
      await sendMail({ to: emails, subject, html }).catch(err =>
        console.error(`[reunions] Erreur rappel ${type} pour ${r.titre} :`, err.message)
      )
      console.log(`[reunions] Rappel ${type} envoyé pour "${r.titre}" (${date})`)
    }
  }
}

module.exports = router
module.exports.sendReminders = sendReminders
