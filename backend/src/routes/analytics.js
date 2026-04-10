/**
 * Routes /api/analytics — Requêtes analytiques sur le schéma normalisé (29 tables)
 * Filtres disponibles : ?direction=X  &debut=2025-01  &fin=2025-06
 * debut / fin sont des chaînes "YYYY-MM" (premier/dernier jour calculés côté backend).
 */
const express = require('express')
const router  = express.Router()
const { QueryTypes } = require('sequelize')
const { sequelize } = require('../models/index')

// ── Helpers filtres combinés (direction + période couverte) ──────────────────
// debut / fin sont des chaînes "YYYY-MM" (ex. "2025-01") ou null
function params(req) {
  return {
    dir:   req.query.direction || null,
    debut: req.query.debut     || null,
    fin:   req.query.fin       || null,
  }
}

function filterWhere(dir, debut, fin) {
  const c = []
  if (dir)   c.push(`d.nom_direction = :dir`)
  if (debut) c.push(`r.periode_debut >= :debut`)
  if (fin)   c.push(`r.periode_debut <= :fin`)
  return c.length ? `WHERE ${c.join(' AND ')}` : ''
}

function filterAnd(dir, debut, fin) {
  const c = []
  if (dir)   c.push(`d.nom_direction = :dir`)
  if (debut) c.push(`r.periode_debut >= :debut`)
  if (fin)   c.push(`r.periode_debut <= :fin`)
  return c.length ? `AND ${c.join(' AND ')}` : ''
}

// Convertit "YYYY-MM" → premier / dernier jour du mois pour les comparaisons SQL
function filterRep(dir, debut, fin, extra = {}) {
  const obj = {}
  if (dir)   obj.dir   = dir
  if (debut) obj.debut = `${debut}-01`
  if (fin) {
    const [y, m] = fin.split('-').map(Number)
    obj.fin = `${fin}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  }
  return { ...obj, ...extra }
}

// ─── GET /api/analytics/overview ──────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [[{ total }], [{ ceMois }], [{ directionsActives }], [{ tauxRH }]] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) AS total
         FROM revues r
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) AS ceMois
         FROM revues r
         JOIN directions d ON d.direction_id = r.direction_id
         WHERE r.date_soumission >= :start ${filterAnd(dir, debut, fin)}`,
        { replacements: filterRep(dir, debut, fin, { start: startOfMonth }), type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(DISTINCT r.direction_id) AS directionsActives
         FROM revues r
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT ROUND(AVG(
           CASE WHEN rh.effectif_en_poste > 0
                THEN rh.effectif_reellement_disponible * 100.0 / rh.effectif_en_poste
                ELSE NULL END
         ), 1) AS tauxRH
         FROM revues r
         JOIN revue_ressources_humaines rh ON rh.revue_id = r.revue_id
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
    ])

    res.json({
      total:             Number(total),
      ceMois:            Number(ceMois),
      directionsActives: Number(directionsActives),
      tauxRH:            tauxRH ? Number(tauxRH) : 0,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/par-direction ─────────────────────────────────────────
router.get('/par-direction', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT d.nom_direction AS direction, COUNT(*) AS total
       FROM revues r
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY d.nom_direction
       ORDER BY total DESC
       LIMIT 15`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/par-mois ──────────────────────────────────────────────
router.get('/par-mois', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const since = new Date()
    since.setMonth(since.getMonth() - 11)
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    const data = await sequelize.query(
      `SELECT YEAR(r.date_soumission) AS yr, MONTH(r.date_soumission) AS mo, COUNT(*) AS total
       FROM revues r
       JOIN directions d ON d.direction_id = r.direction_id
       WHERE r.date_soumission >= :since ${filterAnd(dir, debut, fin)}
       GROUP BY yr, mo
       ORDER BY yr ASC, mo ASC`,
      { replacements: filterRep(dir, debut, fin, { since }), type: QueryTypes.SELECT }
    )

    const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    res.json(data.map(d => ({
      mois:  `${MOIS[Number(d.mo) - 1]} ${d.yr}`,
      total: Number(d.total),
    })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/par-periode ───────────────────────────────────────────
router.get('/par-periode', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT DATE_FORMAT(r.periode_debut, '%Y-%m') AS periode, COUNT(*) AS total
       FROM revues r
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY periode
       ORDER BY total DESC
       LIMIT 12`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/locaux ────────────────────────────────────────────────
router.get('/locaux', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT
         CASE WHEN ri.locaux_adaptes = 1 THEN 'Oui' ELSE 'Non' END AS statut,
         COUNT(*) AS total
       FROM revue_infrastructures ri
       JOIN revues r ON r.revue_id = ri.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY ri.locaux_adaptes`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/rapports ──────────────────────────────────────────────
router.get('/rapports', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT
         CASE WHEN rr.rapports_produits = 1 THEN 'Oui' ELSE 'Non' END AS statut,
         COUNT(*) AS total
       FROM revue_rapports rr
       JOIN revues r ON r.revue_id = rr.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY rr.rapports_produits`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/effectifs ─────────────────────────────────────────────
router.get('/effectifs', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT
         d.nom_direction AS direction,
         ROUND(AVG(d.effectif_theorique), 0) AS theorique,
         ROUND(AVG(rh.effectif_reellement_disponible), 0) AS disponible
       FROM revue_ressources_humaines rh
       JOIN revues r ON r.revue_id = rh.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY d.nom_direction
       ORDER BY theorique DESC
       LIMIT 12`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({
      ...r,
      theorique:  Number(r.theorique)  || 0,
      disponible: Number(r.disponible) || 0,
    })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/equipements ───────────────────────────────────────────
router.get('/equipements', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const [internet, electricite] = await Promise.all([
      sequelize.query(
        `SELECT
           CASE
             WHEN LOWER(eq.disponibilite_internet) LIKE '%fibre%'
               OR LOWER(eq.disponibilite_internet) LIKE '%stable%'
               OR LOWER(eq.disponibilite_internet) LIKE '%satisfais%'       THEN 'Stable'
             WHEN LOWER(eq.disponibilite_internet) LIKE '%lente%'
               OR LOWER(eq.disponibilite_internet) LIKE '%instable%'
               OR LOWER(eq.disponibilite_internet) LIKE '%interruption%'    THEN 'Lente / instable'
             WHEN LOWER(eq.disponibilite_internet) LIKE '%mobile%'
               OR LOWER(eq.disponibilite_internet) LIKE '%données mob%'     THEN 'Données mobiles'
             WHEN LOWER(eq.disponibilite_internet) LIKE '%pas de connexion%'
               OR LOWER(eq.disponibilite_internet) LIKE '%inexist%'
               OR LOWER(eq.disponibilite_internet) LIKE '%absent%'          THEN 'Inexistant'
             ELSE 'Autre'
           END AS statut,
           COUNT(*) AS total
         FROM revue_equipements eq
         JOIN revues r ON r.revue_id = eq.revue_id
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}
         GROUP BY statut
         ORDER BY total DESC`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT
           CASE
             WHEN LOWER(eq.disponibilite_electricite) LIKE '%edh stable%'
               OR (LOWER(eq.disponibilite_electricite) LIKE '%edh%'
                   AND LOWER(eq.disponibilite_electricite) LIKE '%groupe%') THEN 'EDH + Groupe'
             WHEN LOWER(eq.disponibilite_electricite) LIKE '%groupe électrogène permanent%'
               OR LOWER(eq.disponibilite_electricite) LIKE '%groupe seul%'  THEN 'Groupe seul'
             WHEN LOWER(eq.disponibilite_electricite) LIKE '%défaill%'
               OR LOWER(eq.disponibilite_electricite) LIKE '%coupures%'
               OR LOWER(eq.disponibilite_electricite) LIKE '%défaillant%'   THEN 'EDH défaillant'
             WHEN LOWER(eq.disponibilite_electricite) LIKE '%pas de groupe%' THEN 'Pas de groupe'
             ELSE 'Autre'
           END AS statut,
           COUNT(*) AS total
         FROM revue_equipements eq
         JOIN revues r ON r.revue_id = eq.revue_id
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}
         GROUP BY statut
         ORDER BY total DESC`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
    ])

    res.json({
      internet:    internet.map(r    => ({ ...r, total: Number(r.total) })),
      electricite: electricite.map(r => ({ ...r, total: Number(r.total) })),
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/conformite ────────────────────────────────────────────
router.get('/conformite', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)

    // totalDirs = total directions (pas de filtre période — le dénominateur reste fixe)
    const [[{ totalDirs }], [{ avecRevue }], parStatut] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) AS totalDirs FROM directions${dir ? ' WHERE nom_direction = :dir' : ''}`,
        { replacements: dir ? { dir } : {}, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(DISTINCT r.direction_id) AS avecRevue
         FROM revues r
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT r.statut, COUNT(*) AS total
         FROM revues r
         JOIN directions d ON d.direction_id = r.direction_id
         ${filterWhere(dir, debut, fin)}
         GROUP BY r.statut ORDER BY total DESC`,
        { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
      ),
    ])

    const total = Number(totalDirs)
    const avec  = Number(avecRevue)
    res.json({
      totalDirections: total,
      avecRevue:       avec,
      sansRevue:       total - avec,
      parStatut:       parStatut.map(r => ({ statut: r.statut, total: Number(r.total) })),
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/postes-vacants ────────────────────────────────────────
router.get('/postes-vacants', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT d.nom_direction AS direction, MAX(rh.postes_vacants) AS postesVacants
       FROM revue_ressources_humaines rh
       JOIN revues r ON r.revue_id = rh.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY d.nom_direction
       HAVING postesVacants > 0
       ORDER BY postesVacants DESC
       LIMIT 10`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, postesVacants: Number(r.postesVacants) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/besoins-formation ─────────────────────────────────────
router.get('/besoins-formation', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT bf.besoin_formation AS besoin, COUNT(*) AS total
       FROM revue_besoins_formation bf
       JOIN revues r ON r.revue_id = bf.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY bf.besoin_formation
       ORDER BY total DESC
       LIMIT 5`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/activites-non-realisees ───────────────────────────────
router.get('/activites-non-realisees', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT d.nom_direction AS direction, COUNT(*) AS total
       FROM revue_activites ra
       JOIN revues r ON r.revue_id = ra.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       WHERE ra.type_activite IN ('non_realisee', 'en_cours') ${filterAnd(dir, debut, fin)}
       GROUP BY d.nom_direction
       ORDER BY total DESC
       LIMIT 10`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/difficultes-activites ─────────────────────────────────
router.get('/difficultes-activites', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT da.difficulte, COUNT(*) AS total
       FROM revue_difficultes_activites da
       JOIN revues r ON r.revue_id = da.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY da.difficulte
       ORDER BY total DESC
       LIMIT 10`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/infra-indicateurs ─────────────────────────────────────
router.get('/infra-indicateurs', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)

    const [[infra], [eq]] = await Promise.all([
      sequelize.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN ri.locaux_adaptes     = 1 THEN 1 ELSE 0 END) AS locauxOui,
         SUM(CASE WHEN ri.signaletique_visible = 1 THEN 1 ELSE 0 END) AS signaOui
       FROM revue_infrastructures ri
       JOIN revues r ON r.revue_id = ri.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    ),
      sequelize.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN LOWER(disponibilite_internet)   NOT LIKE '%inexist%'
                   AND LOWER(disponibilite_internet)   NOT LIKE '%pas de connexion%'
                   AND LOWER(disponibilite_internet)   NOT LIKE '%absent%'
                   AND disponibilite_internet IS NOT NULL THEN 1 ELSE 0 END) AS internetOui,
         SUM(CASE WHEN LOWER(disponibilite_electricite) NOT LIKE '%défaill%'
                   AND LOWER(disponibilite_electricite) NOT LIKE '%coupures%'
                   AND disponibilite_electricite IS NOT NULL THEN 1 ELSE 0 END) AS elecOui,
         SUM(CASE WHEN LOWER(materiel_informatique) NOT LIKE '%insuffis%'
                   AND LOWER(materiel_informatique) NOT LIKE '%inexist%'
                   AND materiel_informatique IS NOT NULL THEN 1 ELSE 0 END) AS materielOui,
         SUM(CASE WHEN LOWER(mobilier_bureau) NOT LIKE '%insuffis%'
                   AND LOWER(mobilier_bureau) NOT LIKE '%inexist%'
                   AND mobilier_bureau IS NOT NULL THEN 1 ELSE 0 END) AS mobilierOui
       FROM revue_equipements eq
       JOIN revues r ON r.revue_id = eq.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    ),
    ])

    const t1 = Number(infra.total) || 1
    const t2 = Number(eq.total)    || 1
    res.json([
      { indicateur: 'Locaux adaptés',       pct: Math.round(Number(infra.locauxOui)   * 100 / t1) },
      { indicateur: 'Signalétique visible',  pct: Math.round(Number(infra.signaOui)    * 100 / t1) },
      { indicateur: 'Internet disponible',   pct: Math.round(Number(eq.internetOui)    * 100 / t2) },
      { indicateur: 'Électricité stable',    pct: Math.round(Number(eq.elecOui)        * 100 / t2) },
      { indicateur: 'Matériel informatique', pct: Math.round(Number(eq.materielOui)    * 100 / t2) },
      { indicateur: 'Mobilier de bureau',    pct: Math.round(Number(eq.mobilierOui)    * 100 / t2) },
    ])
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/insuffisances ─────────────────────────────────────────
router.get('/insuffisances', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT im.insuffisance, COUNT(*) AS total
       FROM revue_insuffisances_materielles im
       JOIN revues r ON r.revue_id = im.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY im.insuffisance
       ORDER BY total DESC
       LIMIT 15`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/insuffisances-heatmap ─────────────────────────────────
// Retourne [{direction, insuffisance, total}] pour construire une carte de chaleur
router.get('/insuffisances-heatmap', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT d.nom_direction AS direction, im.insuffisance, COUNT(*) AS total
       FROM revue_insuffisances_materielles im
       JOIN revues r ON r.revue_id = im.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY d.nom_direction, im.insuffisance
       ORDER BY total DESC`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/contraintes ───────────────────────────────────────────
router.get('/contraintes', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT rc.contrainte, COUNT(*) AS total
       FROM revue_contraintes rc
       JOIN revues r ON r.revue_id = rc.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       GROUP BY rc.contrainte
       ORDER BY total DESC
       LIMIT 20`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data.map(r => ({ ...r, total: Number(r.total) })))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/appuis ────────────────────────────────────────────────
router.get('/appuis', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT
         d.nom_direction            AS direction,
         ra.decisions_souhaitees    AS decisions,
         ra.appuis_administratifs   AS administratifs,
         ra.appuis_logistiques      AS logistiques,
         ra.appuis_rh               AS rh,
         ra.appuis_numerique        AS numerique
       FROM revue_appuis ra
       JOIN revues r ON r.revue_id = ra.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       ${filterWhere(dir, debut, fin)}
       ORDER BY r.date_soumission DESC
       LIMIT 20`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/valeurs-contraintes ───────────────────────────────────
// Retourne la liste des contraintes déjà soumises (pour autocomplete dans le formulaire)
router.get('/valeurs-contraintes', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT rc.contrainte, COUNT(*) AS total
       FROM revue_contraintes rc
       WHERE rc.contrainte IS NOT NULL AND rc.contrainte != ''
       GROUP BY rc.contrainte
       ORDER BY total DESC
       LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.contrainte))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/valeurs-besoins-formation ─────────────────────────────
router.get('/valeurs-besoins-formation', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT besoin_formation AS val, COUNT(*) AS total
       FROM revue_besoins_formation
       WHERE besoin_formation IS NOT NULL AND besoin_formation != ''
       GROUP BY besoin_formation ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-difficultes ───────────────────────────────────
router.get('/valeurs-difficultes', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT difficulte AS val, COUNT(*) AS total
       FROM revue_difficultes_activites
       WHERE difficulte IS NOT NULL AND difficulte != ''
       GROUP BY difficulte ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-insuffisances ─────────────────────────────────
router.get('/valeurs-insuffisances', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT insuffisance AS val, COUNT(*) AS total
       FROM revue_insuffisances_materielles
       WHERE insuffisance IS NOT NULL AND insuffisance != ''
       GROUP BY insuffisance ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-besoins-personnel ────────────────────────────
router.get('/valeurs-besoins-personnel', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT besoin AS val, COUNT(*) AS total
       FROM revue_besoins_personnel
       WHERE besoin IS NOT NULL AND besoin != ''
       GROUP BY besoin ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-causes-rapports ───────────────────────────────
router.get('/valeurs-causes-rapports', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT cause AS val, COUNT(*) AS total
       FROM revue_causes_difficultes_rapports
       WHERE cause IS NOT NULL AND cause != ''
       GROUP BY cause ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-postes-vacants ────────────────────────────────
router.get('/valeurs-postes-vacants', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT intitule AS val, COUNT(*) AS total
       FROM revue_postes_vacants
       WHERE intitule IS NOT NULL AND intitule != ''
       GROUP BY intitule ORDER BY total DESC LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.val))
  } catch (err) { res.status(500).json({ message: 'Erreur serveur', error: err.message }) }
})

// ─── GET /api/analytics/valeurs-besoins-prioritaires ──────────────────────────
// Retourne la liste des besoins prioritaires déjà soumis (pour autocomplete)
router.get('/valeurs-besoins-prioritaires', async (_req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT bp.besoin, COUNT(*) AS total
       FROM revue_besoins_prioritaires bp
       WHERE bp.besoin IS NOT NULL AND bp.besoin != ''
       GROUP BY bp.besoin
       ORDER BY total DESC
       LIMIT 60`,
      { type: QueryTypes.SELECT }
    )
    res.json(data.map(r => r.besoin))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/analytics/actions ───────────────────────────────────────────────
router.get('/actions', async (req, res) => {
  try {
    const { dir, debut, fin } = params(req)
    const data = await sequelize.query(
      `SELECT
         d.nom_direction   AS direction,
         r.date_reunion    AS dateReunion,
         ra.mesures_dg     AS mesuresDG,
         ra.mesures_ministre AS mesuresMinistre,
         ra.mesures_internes AS mesuresInternes
       FROM revue_actions ra
       JOIN revues r ON r.revue_id = ra.revue_id
       JOIN directions d ON d.direction_id = r.direction_id
       WHERE (ra.mesures_dg IS NOT NULL AND ra.mesures_dg != '')
          OR (ra.mesures_ministre IS NOT NULL AND ra.mesures_ministre != '')
       ${filterAnd(dir, debut, fin)}
       ORDER BY r.date_reunion DESC
       LIMIT 20`,
      { replacements: filterRep(dir, debut, fin), type: QueryTypes.SELECT }
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
