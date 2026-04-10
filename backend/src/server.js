require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const cron    = require('node-cron')
const { sequelize } = require('./models/index')
const revuesRouter       = require('./routes/revues')
const analyticsRouter    = require('./routes/analytics')
const directionsRouter   = require('./routes/directions')
const utilisateursRouter = require('./routes/utilisateurs')
const keycloakRouter     = require('./routes/keycloak')
const auditRouter        = require('./routes/audit')
const reunionsRouter     = require('./routes/reunions')

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Public health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Routes
app.use('/api/directions',   directionsRouter)
app.use('/api/utilisateurs', utilisateursRouter)
app.use('/api/revues',       revuesRouter)
app.use('/api/analytics',    analyticsRouter)
app.use('/api/keycloak',     keycloakRouter)
app.use('/api/audit',        auditRouter)
app.use('/api/reunions',     reunionsRouter)

// Synchronisation DB — alter:true préserve les données existantes tout en
// ajoutant les nouvelles colonnes. Utiliser FORCE=true en env pour repartir
// d'un schéma vierge (DROP + CREATE).
const syncOpts = process.env.DB_FORCE === 'true'
  ? { force: true }
  : { alter: true }

sequelize.sync(syncOpts)
  .then(() => {
    console.log(`Base de données synchronisée (${JSON.stringify(syncOpts)})`)
    app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`))

    // Rappels quotidiens à 8h00 — 7 jours et 1 jour avant chaque réunion
    cron.schedule('0 8 * * *', async () => {
      console.log('[cron] Envoi des rappels de réunion...')
      try {
        await reunionsRouter.sendReminders()
      } catch (err) {
        console.error('[cron] Erreur lors des rappels :', err.message)
      }
    }, { timezone: 'America/Port-au-Prince' })
    console.log('[cron] Rappels réunions planifiés (08:00 HNE)')
  })
  .catch(err => {
    console.error('Erreur de connexion MySQL :', err.message)
    if (err.sql) console.error('SQL en échec :', err.sql)
    if (err.parent) console.error('Cause :', err.parent.message)
    process.exit(1)
  })
