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

// GET /api/analytics/effectifs — effectif théorique vs disponible par direction
router.get('/effectifs', async (req, res) => {
  try {
    const data = await Fiche.aggregate([
      {
        $group: {
          _id: '$intituleDirection',
          theorique:   { $avg: { $toInt: '$effectifTheorique' } },
          disponible:  { $avg: { $toInt: '$effectifDisponible' } },
        },
      },
      { $sort: { theorique: -1 } },
      { $limit: 12 },
      {
        $project: {
          direction: '$_id',
          theorique:  { $round: ['$theorique', 0] },
          disponible: { $round: ['$disponible', 0] },
          _id: 0,
        },
      },
    ])
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/analytics/equipements — internet & electricité distribution
router.get('/equipements', async (req, res) => {
  try {
    const classify = (field, keywords) => ({
      $switch: {
        branches: keywords.map(([label, terms]) => ({
          case: {
            $or: terms.map(t => ({
              $regexMatch: { input: { $toLower: `$${field}` }, regex: t },
            })),
          },
          then: label,
        })),
        default: 'Autre',
      },
    })

    const internetLabels = [
      ['Stable',    ['fibre', 'stable', 'satisfais']],
      ['Lente / instable', ['lente', 'instable', 'interruption']],
      ['Données mobiles', ['mobile', 'données mob']],
      ['Inexistant', ['pas de connexion', 'inexist', 'absent']],
    ]
    const electriciteLabels = [
      ['EDH + Groupe',    ['edh stable', 'edh.*groupe', 'groupe.*edh']],
      ['Groupe seul',     ['groupe électrogène permanent', 'groupe seul']],
      ['EDH défaillant',  ['défaill', 'coupures', 'défaillant']],
      ['Pas de groupe',   ['pas de groupe']],
    ]

    const [internet, electricite] = await Promise.all([
      Fiche.aggregate([
        { $group: { _id: classify('internet', internetLabels), total: { $sum: 1 } } },
        { $project: { statut: '$_id', total: 1, _id: 0 } },
        { $sort: { total: -1 } },
      ]),
      Fiche.aggregate([
        { $group: { _id: classify('electricite', electriciteLabels), total: { $sum: 1 } } },
        { $project: { statut: '$_id', total: 1, _id: 0 } },
        { $sort: { total: -1 } },
      ]),
    ])

    res.json({ internet, electricite })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
