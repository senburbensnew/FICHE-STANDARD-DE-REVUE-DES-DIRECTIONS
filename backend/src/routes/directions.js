/**
 * Routes /api/directions — Gestion des directions (schéma normalisé)
 * Table : directions (29 colonnes selon le document technique)
 */
const express = require('express')
const router  = express.Router()
const { UniqueConstraintError } = require('sequelize')
const { Direction } = require('../models/index')

// GET /api/directions
router.get('/', async (req, res) => {
  try {
    const directions = await Direction.findAll({
      attributes: { exclude: ['created_at', 'updated_at'] },
      order: [['nom_direction', 'ASC']],
    })
    res.json(directions)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/directions/:id
router.get('/:id', async (req, res) => {
  try {
    const direction = await Direction.findByPk(req.params.id)
    if (!direction) return res.status(404).json({ message: 'Direction introuvable.' })
    res.json(direction)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// POST /api/directions
router.post('/', async (req, res) => {
  try {
    const {
      nom_direction, sigle, localisation_siege, email_officiel,
      effectif_theorique, mission_principale, principales_attributions,
      principaux_services_rendus, statut,
    } = req.body

    if (!nom_direction?.trim()) return res.status(400).json({ message: 'Le champ "nom_direction" est requis.' })

    const direction = await Direction.create({
      nom_direction:              nom_direction.trim(),
      sigle:                      sigle?.trim()                      || null,
      localisation_siege:         localisation_siege?.trim()         || '',
      email_officiel:             email_officiel?.trim()             || '',
      effectif_theorique:         effectif_theorique ? Number(effectif_theorique) : null,
      mission_principale:         mission_principale?.trim()         || '',
      principales_attributions:   principales_attributions?.trim()   || '',
      principaux_services_rendus: principaux_services_rendus?.trim() || '',
      statut:                     statut                             || 'Actif',
    })
    res.status(201).json(direction)
  } catch (err) {
    if (err instanceof UniqueConstraintError) return res.status(409).json({ message: 'Cette direction existe déjà.' })
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// PUT /api/directions/:id
router.put('/:id', async (req, res) => {
  try {
    const direction = await Direction.findByPk(req.params.id)
    if (!direction) return res.status(404).json({ message: 'Direction introuvable.' })
    await direction.update(req.body)
    res.json(direction)
  } catch (err) {
    if (err instanceof UniqueConstraintError) return res.status(409).json({ message: 'Ce nom de direction existe déjà.' })
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// DELETE /api/directions/:nom  (compat) ou /:id
router.delete('/:id', async (req, res) => {
  try {
    // Accepte soit un UUID, soit un nom encodé
    let direction = await Direction.findByPk(req.params.id)
    if (!direction) {
      direction = await Direction.findOne({ where: { nom_direction: decodeURIComponent(req.params.id) } })
    }
    if (!direction) return res.status(404).json({ message: 'Direction introuvable.' })
    await direction.destroy()
    res.json({ message: 'Direction supprimée.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
