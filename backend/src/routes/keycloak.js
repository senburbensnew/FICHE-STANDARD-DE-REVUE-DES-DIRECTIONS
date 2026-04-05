/**
 * Routes /api/keycloak — Proxy vers l'API Admin Keycloak
 */
const express = require('express')
const router  = express.Router()
const { audit } = require('../auditLogger')

const KC_URL   = process.env.KEYCLOAK_URL   || 'http://keycloak:8180'
const KC_REALM = process.env.KEYCLOAK_REALM || 'mef'
const KC_ADMIN = process.env.KC_ADMIN       || 'admin'
const KC_PASS  = process.env.KC_ADMIN_PASS  || 'admin'

async function getAdminToken() {
  const res = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id:  'admin-cli',
      username:   KC_ADMIN,
      password:   KC_PASS,
    }),
  })
  if (!res.ok) throw new Error(`Keycloak admin auth failed: ${res.status}`)
  return (await res.json()).access_token
}

async function getRoleRepresentation(adminToken, roleName) {
  const res = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/roles/${encodeURIComponent(roleName)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (!res.ok) throw new Error(`Role "${roleName}" introuvable`)
  return res.json()
}

async function assignRole(adminToken, userId, roleName) {
  const role = await getRoleRepresentation(adminToken, roleName)
  await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify([role]),
  })
}

async function replaceRoles(adminToken, userId, newRoleName) {
  // Remove all current realm roles
  const currentRes = await fetch(
    `${KC_URL}/admin/realms/${KC_REALM}/users/${userId}/role-mappings/realm`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  )
  if (currentRes.ok) {
    const current = await currentRes.json()
    if (current.length) {
      await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${userId}/role-mappings/realm`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(current),
      })
    }
  }
  if (newRoleName) await assignRole(adminToken, userId, newRoleName)
}

// GET /api/keycloak/users[?direction_id=X]
router.get('/users', async (req, res) => {
  try {
    const adminToken = await getAdminToken()
    const kcRes = await fetch(
      `${KC_URL}/admin/realms/${KC_REALM}/users?max=200`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    if (!kcRes.ok) throw new Error(`Keycloak users fetch failed: ${kcRes.status}`)
    let users = await kcRes.json()

    // Filter by direction when requested
    const { direction_id } = req.query
    if (direction_id) {
      users = users.filter(u => u.attributes?.direction_id?.[0] === direction_id)
    }

    // Fetch realm roles for each user in parallel
    const usersWithRoles = await Promise.all(users.map(async (u) => {
      const rolesRes = await fetch(
        `${KC_URL}/admin/realms/${KC_REALM}/users/${u.id}/role-mappings/realm`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      const roles = rolesRes.ok ? await rolesRes.json() : []
      return { ...u, realmRoles: roles.map(r => r.name).filter(n => !n.startsWith('default-roles')) }
    }))

    res.json(usersWithRoles)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/keycloak/users
router.post('/users', async (req, res) => {
  try {
    const adminToken = await getAdminToken()
    const { username, firstName, lastName, email, enabled = true, password, role, fonction, telephone, direction_id } = req.body

    const kcRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        username, firstName, lastName, email, enabled,
        requiredActions: ['UPDATE_PASSWORD'],
        attributes: {
          fonction:     [fonction     || ''],
          telephone:    [telephone    || ''],
          direction_id: [direction_id || ''],
        },
        credentials: password
          ? [{ type: 'password', value: password, temporary: true }]
          : undefined,
      }),
    })

    if (!kcRes.ok) {
      const err = await kcRes.json().catch(() => ({}))
      return res.status(kcRes.status).json({ message: err.errorMessage || `Keycloak error ${kcRes.status}` })
    }

    const location = kcRes.headers.get('location') || ''
    const id = location.split('/').pop()

    if (role && id) await assignRole(adminToken, id, role)

    await audit({ action: 'CREATE', entity_type: 'utilisateur', entity_id: id, entity_label: username, req, details: { role, direction_id } })
    res.status(201).json({ id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/keycloak/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const adminToken = await getAdminToken()
    const { username, firstName, lastName, email, enabled, password, role, fonction, telephone, direction_id } = req.body
    const { id } = req.params

    const kcRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        username, firstName, lastName, email, enabled,
        attributes: {
          fonction:     [fonction     || ''],
          telephone:    [telephone    || ''],
          direction_id: [direction_id || ''],
        },
      }),
    })
    if (!kcRes.ok) {
      const err = await kcRes.json().catch(() => ({}))
      return res.status(kcRes.status).json({ message: err.errorMessage || `Keycloak error ${kcRes.status}` })
    }

    if (password) {
      const pwRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ type: 'password', value: password, temporary: false }),
      })
      if (!pwRes.ok) return res.status(pwRes.status).json({ message: 'Utilisateur mis à jour mais erreur lors du changement de mot de passe.' })
    }

    if (role !== undefined) await replaceRoles(adminToken, id, role)

    await audit({ action: 'UPDATE', entity_type: 'utilisateur', entity_id: id, entity_label: username, req, details: { role, direction_id, enabled } })
    res.json({ message: 'Utilisateur mis à jour.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/keycloak/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const adminToken = await getAdminToken()
    const kcRes = await fetch(`${KC_URL}/admin/realms/${KC_REALM}/users/${req.params.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    if (!kcRes.ok) {
      const err = await kcRes.json().catch(() => ({}))
      return res.status(kcRes.status).json({ message: err.errorMessage || `Keycloak error ${kcRes.status}` })
    }
    await audit({ action: 'DELETE', entity_type: 'utilisateur', entity_id: req.params.id, entity_label: req.params.id, req })
    res.json({ message: 'Utilisateur supprimé.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
