const express = require('express')
const router = express.Router()
const Fiche = require('../models/Fiche')

// Retourne le nombre de jours entiers restants avant la réunion (peut être négatif)
function joursAvantReunion(dateReunionStr) {
  const reunion = new Date(dateReunionStr)
  reunion.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((reunion - today) / (1000 * 60 * 60 * 24))
}

// POST /api/fiches — soumettre une nouvelle fiche
router.post('/', async (req, res) => {
  try {
    const { intituleDirection, periodeCoverte, dateReunion } = req.body

    // Règle 1 : une direction ne peut soumettre qu'une seule fois par mois (periodeCoverte)
    const doublon = await Fiche.findOne({ intituleDirection, periodeCoverte })
    if (doublon) {
      return res.status(409).json({
        message: `La direction "${intituleDirection}" a déjà soumis une fiche pour la période "${periodeCoverte}".`,
      })
    }

    // Règle 2 : la soumission doit se faire au moins 2 jours avant la réunion
    if (joursAvantReunion(dateReunion) < 2) {
      return res.status(400).json({
        message: 'La soumission doit être effectuée au moins 2 jours avant la date de la réunion.',
      })
    }

    const fiche = new Fiche(req.body)
    const saved = await fiche.save()
    res.status(201).json({ message: 'Fiche enregistrée avec succès', id: saved._id })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const fields = Object.keys(err.errors)
      return res.status(400).json({ message: 'Champs manquants ou invalides', fields })
    }
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/fiches — lister toutes les fiches (avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { direction, mois } = req.query
    const filter = {}
    if (direction) filter.intituleDirection = { $regex: direction, $options: 'i' }
    if (mois) filter.periodeCoverte = { $regex: mois, $options: 'i' }

    const fiches = await Fiche.find(filter)
      .select('intituleDirection responsable periodeCoverte dateReunion createdAt')
      .sort({ createdAt: -1 })
    res.json(fiches)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/fiches/:id — détail d'une fiche
router.get('/:id', async (req, res) => {
  try {
    const fiche = await Fiche.findById(req.params.id)
    if (!fiche) return res.status(404).json({ message: 'Fiche introuvable' })
    res.json(fiche)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// PUT /api/fiches/:id — mettre à jour une fiche
router.put('/:id', async (req, res) => {
  try {
    const existing = await Fiche.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Fiche introuvable' })

    // Règle : la modification n'est autorisée que jusqu'à 2 jours avant la réunion
    if (joursAvantReunion(existing.dateReunion) < 2) {
      return res.status(403).json({
        message: 'La modification n\'est plus autorisée : la date limite (2 jours avant la réunion) est dépassée.',
      })
    }

    const fiche = await Fiche.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    res.json({ message: 'Fiche mise à jour', fiche })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// DELETE /api/fiches/:id — supprimer une fiche
router.delete('/:id', async (req, res) => {
  try {
    const fiche = await Fiche.findByIdAndDelete(req.params.id)
    if (!fiche) return res.status(404).json({ message: 'Fiche introuvable' })
    res.json({ message: 'Fiche supprimée' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
