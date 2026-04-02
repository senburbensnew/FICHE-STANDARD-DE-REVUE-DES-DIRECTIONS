const express = require('express')
const router = express.Router()
const { QueryTypes } = require('sequelize')
const sequelize = require('../db')

// GET /api/analytics/overview — chiffres globaux
router.get('/overview', async (req, res) => {
  try {
    const [[{ total }]] = await sequelize.query(
      'SELECT COUNT(*) AS total FROM fiches',
      { type: QueryTypes.SELECT, raw: true, plain: false }
    )

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [[{ ceMois }]] = await sequelize.query(
      'SELECT COUNT(*) AS ceMois FROM fiches WHERE createdAt >= :start',
      { replacements: { start: startOfMonth }, type: QueryTypes.SELECT, raw: true, plain: false }
    )

    const [[{ directionsActives }]] = await sequelize.query(
      'SELECT COUNT(DISTINCT intituleDirection) AS directionsActives FROM fiches',
      { type: QueryTypes.SELECT, raw: true, plain: false }
    )

    res.json({
      total: Number(total),
      ceMois: Number(ceMois),
      directionsActives: Number(directionsActives),
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/par-direction — nb de fiches par direction
router.get('/par-direction', async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT intituleDirection AS direction, COUNT(*) AS total
       FROM fiches
       GROUP BY intituleDirection
       ORDER BY total DESC
       LIMIT 15`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/par-mois — nb de fiches soumises par mois (12 derniers mois)
router.get('/par-mois', async (req, res) => {
  try {
    const since = new Date()
    since.setMonth(since.getMonth() - 11)
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    const data = await sequelize.query(
      `SELECT YEAR(createdAt) AS yr, MONTH(createdAt) AS mo, COUNT(*) AS total
       FROM fiches
       WHERE createdAt >= :since
       GROUP BY yr, mo
       ORDER BY yr ASC, mo ASC`,
      { replacements: { since }, type: QueryTypes.SELECT }
    )

    const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const result = data.map(d => ({
      mois:  `${MOIS[Number(d.mo) - 1]} ${d.yr}`,
      total: Number(d.total),
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/locaux — locaux adaptés oui/non
router.get('/locaux', async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT locauxAdaptes AS statut, COUNT(*) AS total
       FROM fiches
       GROUP BY locauxAdaptes`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/rapports — rapports périodiques oui/non
router.get('/rapports', async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT rapportsPeriodiques AS statut, COUNT(*) AS total
       FROM fiches
       GROUP BY rapportsPeriodiques`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/par-periode — nb de fiches par période couverte
router.get('/par-periode', async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT periodeCoverte AS periode, COUNT(*) AS total
       FROM fiches
       GROUP BY periodeCoverte
       ORDER BY total DESC
       LIMIT 12`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/effectifs — effectif théorique vs disponible par direction
router.get('/effectifs', async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT
         intituleDirection AS direction,
         ROUND(AVG(CAST(effectifTheorique  AS UNSIGNED)), 0) AS theorique,
         ROUND(AVG(CAST(effectifDisponible AS UNSIGNED)), 0) AS disponible
       FROM fiches
       GROUP BY intituleDirection
       ORDER BY theorique DESC
       LIMIT 12`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, theorique: Number(r.theorique), disponible: Number(r.disponible) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/equipements — internet & electricité distribution
router.get('/equipements', async (req, res) => {
  try {
    const [internet, electricite] = await Promise.all([
      sequelize.query(
        `SELECT
           CASE
             WHEN LOWER(internet) LIKE '%fibre%'
               OR LOWER(internet) LIKE '%stable%'
               OR LOWER(internet) LIKE '%satisfais%'       THEN 'Stable'
             WHEN LOWER(internet) LIKE '%lente%'
               OR LOWER(internet) LIKE '%instable%'
               OR LOWER(internet) LIKE '%interruption%'    THEN 'Lente / instable'
             WHEN LOWER(internet) LIKE '%mobile%'
               OR LOWER(internet) LIKE '%données mob%'     THEN 'Données mobiles'
             WHEN LOWER(internet) LIKE '%pas de connexion%'
               OR LOWER(internet) LIKE '%inexist%'
               OR LOWER(internet) LIKE '%absent%'          THEN 'Inexistant'
             ELSE 'Autre'
           END AS statut,
           COUNT(*) AS total
         FROM fiches
         GROUP BY statut
         ORDER BY total DESC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT
           CASE
             WHEN LOWER(electricite) LIKE '%edh stable%'
               OR (LOWER(electricite) LIKE '%edh%' AND LOWER(electricite) LIKE '%groupe%') THEN 'EDH + Groupe'
             WHEN LOWER(electricite) LIKE '%groupe électrogène permanent%'
               OR LOWER(electricite) LIKE '%groupe seul%'                                  THEN 'Groupe seul'
             WHEN LOWER(electricite) LIKE '%défaill%'
               OR LOWER(electricite) LIKE '%coupures%'
               OR LOWER(electricite) LIKE '%défaillant%'                                   THEN 'EDH défaillant'
             WHEN LOWER(electricite) LIKE '%pas de groupe%'                                THEN 'Pas de groupe'
             ELSE 'Autre'
           END AS statut,
           COUNT(*) AS total
         FROM fiches
         GROUP BY statut
         ORDER BY total DESC`,
        { type: QueryTypes.SELECT }
      ),
    ])

    res.json({
      internet:    internet.map(r    => ({ ...r,    total: Number(r.total) })),
      electricite: electricite.map(r => ({ ...r, total: Number(r.total) })),
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
