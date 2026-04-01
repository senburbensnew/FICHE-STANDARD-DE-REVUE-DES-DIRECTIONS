const express = require('express')
const router = express.Router()
const Fiche = require('../models/Fiche')

// GET /api/analytics/overview — chiffres globaux
router.get('/overview', async (req, res) => {
  try {
    const total = await Fiche.countDocuments()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const ceMois = await Fiche.countDocuments({ createdAt: { $gte: startOfMonth } })

    const directionsActives = await Fiche.distinct('intituleDirection')

    res.json({ total, ceMois, directionsActives: directionsActives.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/par-direction — nb de fiches par direction
router.get('/par-direction', async (req, res) => {
  try {
    const data = await Fiche.aggregate([
      { $group: { _id: '$intituleDirection', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 15 },
      { $project: { direction: '$_id', total: 1, _id: 0 } },
    ])
    res.json(data)
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

    const data = await Fiche.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const result = data.map(d => ({
      mois: `${MOIS[d._id.month - 1]} ${d._id.year}`,
      total: d.total,
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/locaux — locaux adaptés oui/non
router.get('/locaux', async (req, res) => {
  try {
    const data = await Fiche.aggregate([
      { $group: { _id: '$locauxAdaptes', total: { $sum: 1 } } },
      { $project: { statut: '$_id', total: 1, _id: 0 } },
    ])
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/rapports — rapports périodiques oui/non
router.get('/rapports', async (req, res) => {
  try {
    const data = await Fiche.aggregate([
      { $group: { _id: '$rapportsPeriodiques', total: { $sum: 1 } } },
      { $project: { statut: '$_id', total: 1, _id: 0 } },
    ])
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/par-periode — nb de fiches par période couverte
router.get('/par-periode', async (req, res) => {
  try {
    const data = await Fiche.aggregate([
      { $group: { _id: '$periodeCoverte', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 12 },
      { $project: { periode: '$_id', total: 1, _id: 0 } },
    ])
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
