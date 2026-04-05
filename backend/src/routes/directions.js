/**
 * Routes /api/directions — Gestion des directions (schéma normalisé)
 * Table : directions (29 colonnes selon le document technique)
 */
const express = require('express')
const router  = express.Router()
const { UniqueConstraintError } = require('sequelize')
const { Direction } = require('../models/index')
const { audit } = require('../auditLogger')

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
    await audit({ action: 'CREATE', entity_type: 'direction', entity_id: String(direction.direction_id), entity_label: direction.nom_direction, req })
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
    await audit({ action: 'UPDATE', entity_type: 'direction', entity_id: String(direction.direction_id), entity_label: direction.nom_direction, req })
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

    const directionId = String(direction.direction_id)
    await direction.destroy()

    // Clear direction_id on all Keycloak users assigned to this direction
    try {
      const KC_URL   = process.env.KEYCLOAK_URL   || 'http://keycloak:8180'
      const KC_REALM = process.env.KEYCLOAK_REALM || 'mef'
      const KC_ADMIN = process.env.KC_ADMIN       || 'admin'
      const KC_PASS  = process.env.KC_ADMIN_PASS  || 'admin'

      const tokenRes = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: KC_ADMIN, password: KC_PASS }),
      })
      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json()
        const usersRes = await fetch(
          `${KC_URL}/admin/realms/${KC_REALM}/users?max=500`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )
        if (usersRes.ok) {
          const users = await usersRes.json()
          const affected = users.filter(u => u.attributes?.direction_id?.[0] === directionId)
          await Promise.all(affected.map(u =>
            fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
              body: JSON.stringify({
                ...u,
                attributes: { ...u.attributes, direction_id: [''] },
              }),
            })
          ))
        }
      }
    } catch (_) {
      // Non-blocking — direction is already deleted; log but don't fail
    }

    await audit({ action: 'DELETE', entity_type: 'direction', entity_id: directionId, entity_label: direction.nom_direction, req })
    res.json({ message: 'Direction supprimée.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
