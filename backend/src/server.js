require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const fichesRouter = require('./routes/fiches')
const analyticsRouter = require('./routes/analytics')
const { requireAuth } = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Public health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Protected routes
app.use('/api/fiches', fichesRouter)              // public — no auth required for now
app.use('/api/analytics', requireAuth, analyticsRouter) // protected — requires Keycloak token

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB')
    app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Erreur de connexion MongoDB :', err.message)
    process.exit(1)
  })
