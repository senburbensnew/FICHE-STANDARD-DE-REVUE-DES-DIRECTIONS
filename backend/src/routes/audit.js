/**
 * Routes /api/audit — Historique des actions
 * Accessible uniquement aux rôles : admin, direction-generale
 */
const express  = require('express')
const { Op }   = require('sequelize')
const router   = express.Router()
const { AuditLog } = require('../models/index')
const { requireAuth, requireRole } = require('../middleware/auth')

function requireAnyRole(...roles) {
  return (req, res, next) => {
    const userRoles = [
      ...(req.user?.realm_access?.roles || []),
      ...Object.values(req.user?.resource_access || {}).flatMap(r => r.roles || []),
    ]
    if (roles.some(r => userRoles.includes(r))) return next()
    return res.status(403).json({ message: `Accès refusé. Rôles requis : ${roles.join(', ')}` })
  }
}

// GET /api/audit?action=&entity_type=&performed_by=&from=&to=&limit=&offset=
router.get('/', requireAuth, requireAnyRole('admin', 'direction-generale'), async (req, res) => {
  try {
    const { action, entity_type, performed_by, from, to } = req.query
    const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 500)
    const offset = parseInt(req.query.offset || '0', 10)

    const where = {}
    if (action)       where.action      = action
    if (entity_type)  where.entity_type = entity_type
    if (performed_by) where.performed_by = { [Op.like]: `%${performed_by}%` }
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at[Op.gte] = new Date(from)
      if (to)   where.created_at[Op.lte] = new Date(to + 'T23:59:59Z')
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    })

    res.json({ total: count, rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
