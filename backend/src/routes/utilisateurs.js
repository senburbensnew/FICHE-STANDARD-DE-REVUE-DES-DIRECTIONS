const express = require('express')
const router  = express.Router()
router.all('/{*path}', (req, res) => res.status(410).json({ message: 'Les utilisateurs sont gérés via Keycloak.' }))
module.exports = router
