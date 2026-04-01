const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080'
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'mef'

const jwksClient = jwksRsa({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 min
})

function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key.getPublicKey())
  })
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalide ou expiré', detail: err.message })
    }
    req.user = decoded
    next()
  })
}

// Role-based guard: requireRole('mef-admin') or requireRole('mef-agent')
function requireRole(role) {
  return (req, res, next) => {
    const roles =
      req.user?.realm_access?.roles || []
    const clientRoles = Object.values(req.user?.resource_access || {})
      .flatMap(r => r.roles || [])
    const allRoles = [...roles, ...clientRoles]

    if (!allRoles.includes(role)) {
      return res.status(403).json({ message: `Rôle requis : ${role}` })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }
