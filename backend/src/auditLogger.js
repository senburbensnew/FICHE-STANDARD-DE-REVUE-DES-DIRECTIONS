/**
 * Utility to write audit log entries.
 * Extracts actor from the JWT in the Authorization header (no full verification —
 * just payload decode for logging purposes; security is enforced upstream).
 */
const { AuditLog } = require('./models/index')

function extractActor(req) {
  try {
    const header = req.headers?.authorization || ''
    if (!header.startsWith('Bearer ')) return 'inconnu'
    const payload = header.split('.')[1]
    if (!payload) return 'inconnu'
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded.preferred_username || decoded.sub || 'inconnu'
  } catch {
    return 'inconnu'
  }
}

/**
 * @param {object} opts
 * @param {string} opts.action        CREATE | UPDATE | DELETE
 * @param {string} opts.entity_type   revue | direction | utilisateur
 * @param {string} [opts.entity_id]
 * @param {string} [opts.entity_label]
 * @param {object} [opts.req]         Express request (to extract actor)
 * @param {string} [opts.performed_by] Override actor name
 * @param {object} [opts.details]     Extra JSON context
 */
async function audit({ action, entity_type, entity_id, entity_label, req, performed_by, details }) {
  try {
    await AuditLog.create({
      action,
      entity_type,
      entity_id:    entity_id    || null,
      entity_label: entity_label || null,
      performed_by: performed_by ?? (req ? extractActor(req) : 'inconnu'),
      details:      details      || null,
    })
  } catch (err) {
    // Non-blocking — never fail a request because of audit logging
    console.error('[audit] write failed:', err.message)
  }
}

module.exports = { audit }
