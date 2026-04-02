const express = require('express')
const router = express.Router()
const { UniqueConstraintError } = require('sequelize')
const Direction = require('../models/Direction')

const SEED = [
  // Direction Générale
  'Direction Générale',
  'Cabinet du Ministre',
  'Cabinet du Ministre Délégué',
  'Secrétariat Général',

  // Directions Centrales
  'Direction du Budget',
  'Direction Générale des Impôts (DGI)',
  'Direction Générale des Douanes (AGD)',
  'Direction du Trésor',
  'Direction de la Comptabilité Publique et du Contrôle Budgétaire (DPCB)',
  'Direction des Assurances',
  'Direction des Investissements Publics (DIP)',
  'Direction de la Coopération Externe (DCE)',
  'Direction des Études et de la Planification',
  'Direction des Affaires Juridiques',
  'Direction des Ressources Humaines',
  'Direction Administrative',
  'Direction des Technologies de l\'Information et de la Communication (DTIC)',
  'Direction de la Communication',
  'Direction du Patrimoine de l\'État',

  // Unités et Services
  'Unité d\'Études et de Programmation (UEP)',
  'Unité de Lutte contre la Corruption (ULCC)',
  'Unité Centrale de Renseignements Financiers (UCREF)',
  'Service de l\'Inspection Générale des Finances (IGF)',
  'Service des Archives et de la Documentation',
  'Service du Contrôle Interne',
  'Cellule de Gestion Financière',
  'Cellule de Passation des Marchés',
]

// Seed on first use if table is empty
async function seedIfEmpty() {
  const count = await Direction.count()
  if (count === 0) {
    await Direction.bulkCreate(SEED.map(nom => ({ nom })), { ignoreDuplicates: true })
  }
}

// GET /api/directions
router.get('/', async (req, res) => {
  try {
    await seedIfEmpty()
    const directions = await Direction.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['nom', 'ASC']],
    })
    res.json(directions)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// POST /api/directions — ajouter une direction
router.post('/', async (req, res) => {
  try {
    const { nom, responsable, fonction, localisation, coordonneesTel, adresseEmail,
            missionPrincipale, principalesAttributions, principauxServices } = req.body
    if (!nom?.trim()) return res.status(400).json({ message: 'Le champ "nom" est requis.' })
    const direction = await Direction.create({
      nom: nom.trim(),
      responsable:             responsable?.trim()             || '',
      fonction:                fonction?.trim()                || '',
      localisation:            localisation?.trim()            || '',
      coordonneesTel:          coordonneesTel?.trim()          || '',
      adresseEmail:            adresseEmail?.trim()            || '',
      missionPrincipale:       missionPrincipale?.trim()       || '',
      principalesAttributions: principalesAttributions?.trim() || '',
      principauxServices:      principauxServices?.trim()      || '',
    })
    res.status(201).json(direction)
  } catch (err) {
    if (err instanceof UniqueConstraintError) return res.status(409).json({ message: 'Cette direction existe déjà.' })
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// DELETE /api/directions/:nom — supprimer une direction
router.delete('/:nom', async (req, res) => {
  try {
    const direction = await Direction.findOne({ where: { nom: decodeURIComponent(req.params.nom) } })
    if (!direction) return res.status(404).json({ message: 'Direction introuvable.' })
    await direction.destroy()
    res.json({ message: 'Direction supprimée.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
