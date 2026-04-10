/**
 * Routes /api/reunions
 * Gestion des réunions par la Direction Générale.
 * Envoie des notifications email à tous les utilisateurs à la création.
 */
const express = require('express')
const router  = express.Router()
const { Reunion, Revue, Direction } = require('../models/index')
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
    : type === 'annulation'
    ? `Réunion annulée : ${reunion.titre}`
    : type === 'rappel_soumission_24h'
    ? `Rappel soumission — Réunion du ${fmtDate(reunion.date_reunion)} : ${reunion.titre}`
    : `Nouvelle réunion planifiée : ${reunion.titre}`

  const intro = type === 'creation'
    ? 'Une nouvelle réunion a été planifiée par la Direction Générale.'
    : type === 'rappel_7j'
    ? 'Rappel : une réunion est prévue dans <strong>7 jours</strong>.'
    : type === 'rappel_1j'
    ? 'Rappel : une réunion est prévue <strong>demain</strong>.'
    : type === 'rappel_soumission_24h'
    ? `Votre direction n'a pas encore soumis sa fiche de revue pour la réunion du <strong>${fmtDate(reunion.date_reunion)}</strong>. Le délai de soumission expire dans <strong>24 heures</strong>.`
    : '<strong style="color:#b91c1c">Cette réunion a été annulée par la Direction Générale.</strong>'

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

    // Notify all users asynchronously
    getAllUserEmails().then(emails => {
      if (!emails.length) return
      const subject = `Réunion annulée : ${reunion.titre}`
      const html = reunionEmailHtml(reunion.toJSON(), 'annulation')
      return sendMail({ to: emails, subject, html })
    }).catch(err => console.error('[reunions] Erreur envoi email annulation :', err.message))

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
 * - Rappel 7j et 1j avant chaque réunion (tous utilisateurs)
 * - Rappel 24h après la réunion aux directions n'ayant pas encore soumis
 */
async function sendReminders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const in7      = new Date(today); in7.setDate(today.getDate() + 7)
  const in1      = new Date(today); in1.setDate(today.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const toISO = (d) => d.toISOString().split('T')[0]

  // ── Rappels pré-réunion (tous utilisateurs) ──────────────────────────────
  const preTargets = [
    { date: toISO(in7), type: 'rappel_7j' },
    { date: toISO(in1), type: 'rappel_1j' },
  ]

  for (const { date, type } of preTargets) {
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

  // ── Rappel 24h post-réunion — directions n'ayant pas encore soumis ───────
  const reunionsHier = await Reunion.findAll({
    where: { date_reunion: toISO(yesterday), est_annulee: false },
  })

  for (const r of reunionsHier) {
    // Directions ayant déjà soumis une revue pour cette date de réunion
    const soumises = await Revue.findAll({
      where: { date_reunion: r.date_reunion },
      attributes: ['direction_id'],
    })
    const soumisesIds = soumises.map(s => s.direction_id)

    // Directions actives qui n'ont pas encore soumis
    const allDirs = await Direction.findAll({
      where: { statut: 'Actif' },
      attributes: ['direction_id', 'nom_direction', 'email_officiel'],
    })
    const emails = allDirs
      .filter(d => !soumisesIds.includes(d.direction_id) && d.email_officiel)
      .map(d => d.email_officiel)

    if (!emails.length) {
      console.log(`[reunions] Rappel soumission : toutes les directions ont déjà soumis pour "${r.titre}"`)
      continue
    }

    const subject = `Rappel soumission — Réunion du ${fmtDate(r.date_reunion)} : ${r.titre}`
    const html    = reunionEmailHtml(r.toJSON(), 'rappel_soumission_24h')
    await sendMail({ to: emails, subject, html }).catch(err =>
      console.error(`[reunions] Erreur rappel soumission 24h pour "${r.titre}" :`, err.message)
    )
    console.log(`[reunions] Rappel soumission 24h envoyé à ${emails.length} direction(s) pour "${r.titre}"`)
  }
}

// ─── GET /api/reunions/:id/soumissions ───────────────────────────────────────
// Retourne le nombre de directions ayant soumis pour cette réunion (par date_reunion)
router.get('/:id/soumissions', async (req, res) => {
  try {
    const reunion = await Reunion.findByPk(req.params.id)
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' })

    const [soumises, totalDirs] = await Promise.all([
      Revue.findAll({
        where: { date_reunion: reunion.date_reunion },
        attributes: ['direction_id'],
      }),
      Direction.count({ where: { statut: 'Actif' } }),
    ])

    res.json({
      soumises:    soumises.length,
      total:       totalDirs,
      deadline:    new Date(new Date(reunion.date_reunion).getTime() + 48 * 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
module.exports.sendReminders = sendReminders
