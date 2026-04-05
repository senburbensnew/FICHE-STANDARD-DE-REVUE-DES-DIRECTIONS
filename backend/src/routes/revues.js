/**
 * Routes /api/revues — CRUD pour les revues de direction
 * Remplace l'ancienne route /api/fiches avec le schéma normalisé en 29 tables.
 */
const express = require('express')
const router  = express.Router()
const { Op }  = require('sequelize')
const { audit } = require('../auditLogger')
const {
  sequelize, Direction, Revue,
  RevueRH, RevueRepartitionPersonnel, RevueBesoinsPersonnel, RevueBesoinsFormation,
  RevueActivite, RevueResultat, RevueDifficulteActivite,
  RevueInfrastructure, RevueTravailPrioritaire,
  RevueEquipement, RevueInsuffisancesMat,
  RevueCommunication, RevueOutilNumerique, RevueProcedureDematerialisee,
  RevueProcedureManuelle, RevueBesoinDigitalisation,
  RevueRapport, RevueDernierRapport, RevueLivrable, RevueCauseDifficulteRapport,
  RevueContrainte, RevueBesoinPrioritaire,
  RevueAction, RevueAppui, RevueObservation, RevueSignature,
} = require('../models/index')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function joursAvantReunion(dateStr) {
  const reunion = new Date(dateStr)
  reunion.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((reunion - today) / (1000 * 60 * 60 * 24))
}

/**
 * Crée tous les enregistrements sous-tables dans une transaction.
 * @param {string} revue_id
 * @param {object} body  — payload complet du formulaire
 * @param {object} t     — transaction Sequelize
 */
async function createSubtables(revue_id, body, t) {
  const opt = { transaction: t }

  // Section III — Ressources humaines
  await RevueRH.create({
    revue_id,
    effectif_en_poste:            Number(body.effectifPoste)     || 0,
    effectif_reellement_disponible: Number(body.effectifDisponible) || 0,
    postes_vacants:               Number(body.postesVacants)     || 0,
    difficultes_rh:               body.difficultesRH || '',
  }, opt)

  // III Multiple — repartition personnel
  const repartition = Array.isArray(body.repartitionPersonnel) ? body.repartitionPersonnel : []
  for (const r of repartition) {
    if (r.categorie && r.categorie.trim()) {
      await RevueRepartitionPersonnel.create({ revue_id, categorie: r.categorie, nombre: Number(r.nombre) || 0 }, opt)
    }
  }

  // III Multiple — besoins personnel
  const besoinsPersonnel = Array.isArray(body.besoinsPrioPersonnel) ? body.besoinsPrioPersonnel : []
  for (const b of besoinsPersonnel) {
    if (typeof b === 'string' && b.trim()) await RevueBesoinsPersonnel.create({ revue_id, besoin: b.trim() }, opt)
  }

  // III Multiple — besoins formation
  const besoinsFormation = Array.isArray(body.besoinsFormation) ? body.besoinsFormation : []
  for (const b of besoinsFormation) {
    if (typeof b === 'string' && b.trim()) await RevueBesoinsFormation.create({ revue_id, besoin_formation: b.trim() }, opt)
  }

  // Section IV — Activités (3 types)
  const actTypes = [
    { field: 'activitesRealisees',    type: 'principale_realisee' },
    { field: 'activitesEnCours',      type: 'en_cours' },
    { field: 'activitesNonRealisees', type: 'non_realisee' },
  ]
  for (const { field, type } of actTypes) {
    const list = Array.isArray(body[field]) ? body[field] : []
    for (let i = 0; i < list.length; i++) {
      if (typeof list[i] === 'string' && list[i].trim()) {
        await RevueActivite.create({ revue_id, type_activite: type, description: list[i].trim(), ordre_affichage: i + 1 }, opt)
      }
    }
  }

  // IV Multiple — résultats
  const resultats = Array.isArray(body.resultatsObtenus) ? body.resultatsObtenus : []
  for (const r of resultats) {
    if (typeof r === 'string' && r.trim()) await RevueResultat.create({ revue_id, resultat: r.trim() }, opt)
  }

  // IV Multiple — difficultés activités
  const diffsAct = Array.isArray(body.difficultesExecution) ? body.difficultesExecution : []
  for (const d of diffsAct) {
    if (typeof d === 'string' && d.trim()) await RevueDifficulteActivite.create({ revue_id, difficulte: d.trim() }, opt)
  }

  // Section V — Infrastructures
  await RevueInfrastructure.create({
    revue_id,
    locaux_adaptes:         body.locauxAdaptes === 'Oui' || body.locauxAdaptes === true,
    etat_general_batiments: body.etatBatiments     || '',
    niveau_exiguite:        body.niveauExiguite    || '',
    etat_proprete:          body.etatProprete      || '',
    signaletique_visible:   body.signaletique === 'Oui' || body.signaletique === true,
    conditions_accueil:     body.conditionsAccueil || '',
  }, opt)

  // V Multiple — travaux prioritaires
  const travaux = Array.isArray(body.travauxPrioritaires) ? body.travauxPrioritaires : []
  for (const t2 of travaux) {
    if (typeof t2 === 'string' && t2.trim()) await RevueTravailPrioritaire.create({ revue_id, travail: t2.trim() }, opt)
  }

  // Section VI — Équipements
  await RevueEquipement.create({
    revue_id,
    mobilier_bureau:           body.mobilierBureau       || '',
    materiel_informatique:     body.materielInformatique || '',
    etat_informatique:         body.etatOrdinateurs      || '',
    disponibilite_electricite: body.electricite          || '',
    disponibilite_internet:    body.internet             || '',
    disponibilite_vehicules:   body.vehicules            || '',
    autres_equipements:        body.autresEquipements    || '',
  }, opt)

  // VI Multiple — insuffisances matérielles
  const insuf = Array.isArray(body.insuffisancesMaterielles) ? body.insuffisancesMaterielles : []
  for (const i2 of insuf) {
    if (typeof i2 === 'string' && i2.trim()) await RevueInsuffisancesMat.create({ revue_id, insuffisance: i2.trim() }, opt)
  }

  // Section VII — Communication
  await RevueCommunication.create({
    revue_id,
    circulation_information:    body.circulationInfo           || '',
    relations_autres_structures: body.relationsAutresStructures || '',
    difficultes_informatiques:  body.difficultesInternet       || '',
  }, opt)

  // VII Multiple — outils numériques
  const outils = Array.isArray(body.outilsNumeriques) ? body.outilsNumeriques : []
  for (const o of outils) {
    if (typeof o === 'string' && o.trim()) await RevueOutilNumerique.create({ revue_id, outil: o.trim() }, opt)
  }

  // VII Multiple — procédures dématérialisées
  const procDem = Array.isArray(body.proceduresDematerialisees) ? body.proceduresDematerialisees : []
  for (const p of procDem) {
    if (typeof p === 'string' && p.trim()) await RevueProcedureDematerialisee.create({ revue_id, procedure: p.trim() }, opt)
  }

  // VII Multiple — procédures manuelles
  const procMan = Array.isArray(body.proceduresManuelles) ? body.proceduresManuelles : []
  for (const p of procMan) {
    if (typeof p === 'string' && p.trim()) await RevueProcedureManuelle.create({ revue_id, procedure: p.trim() }, opt)
  }

  // VII Multiple — besoins digitalisation
  const besoinsDig = Array.isArray(body.besoinsDig) ? body.besoinsDig : []
  for (const b of besoinsDig) {
    if (typeof b === 'string' && b.trim()) await RevueBesoinDigitalisation.create({ revue_id, besoin: b.trim() }, opt)
  }

  // Section VIII — Rapports
  await RevueRapport.create({
    revue_id,
    rapports_produits:        body.rapportsPeriodiques === 'Oui' || body.rapportsPeriodiques === true,
    frequence_production:     body.frequenceProduction     || '',
    tableaux_bord_disponibles: body.tableauxBord === 'Oui' || body.tableauxBord === true,
    statistiques_disponibles: body.statistiquesDisponibles === 'Oui' || body.statistiquesDisponibles === true,
    retards_insuffisances:    body.retardsRapports         || '',
  }, opt)

  // VIII Multiple — derniers rapports
  const dernRap = Array.isArray(body.derniersRapports) ? body.derniersRapports : []
  for (const r of dernRap) {
    if (typeof r === 'string' && r.trim()) await RevueDernierRapport.create({ revue_id, rapport: r.trim() }, opt)
  }

  // VIII Multiple — livrables
  const livrables = Array.isArray(body.principauxLivrables) ? body.principauxLivrables : []
  for (const l of livrables) {
    if (typeof l === 'string' && l.trim()) await RevueLivrable.create({ revue_id, livrable: l.trim() }, opt)
  }

  // VIII Multiple — causes difficultés rapports
  const causes = Array.isArray(body.causesRapports) ? body.causesRapports : []
  for (const c of causes) {
    if (typeof c === 'string' && c.trim()) await RevueCauseDifficulteRapport.create({ revue_id, cause: c.trim() }, opt)
  }

  // Section IX — Contraintes (max 3)
  const contraintes = Array.isArray(body.contraintes) ? body.contraintes.slice(0, 3) : []
  for (let i = 0; i < contraintes.length; i++) {
    const c = contraintes[i]
    const text = typeof c === 'object' ? c.contrainte : c
    if (text && text.trim()) await RevueContrainte.create({ revue_id, ordre: i + 1, contrainte: text.trim() }, opt)
  }

  // Section X — Besoins prioritaires (max 5)
  const besoins = Array.isArray(body.besoinsPrioritaires) ? body.besoinsPrioritaires.slice(0, 5) : []
  for (let i = 0; i < besoins.length; i++) {
    const b = besoins[i]
    const text = typeof b === 'object' ? b.besoin : b
    if (text && text.trim()) await RevueBesoinPrioritaire.create({ revue_id, ordre: i + 1, besoin: text.trim() }, opt)
  }

  // Section XI — Actions / mesures
  await RevueAction.create({
    revue_id,
    mesures_internes: body.mesuresStructure || '',
    mesures_dg:       body.mesuresDG        || '',
    mesures_ministre: body.mesuresMinistre  || '',
  }, opt)

  // Section XII — Appuis
  await RevueAppui.create({
    revue_id,
    decisions_souhaitees:  body.decisionsOuhaitees || '',
    appuis_administratifs: body.appuisAdmin        || '',
    appuis_logistiques:    body.appuisLogistiques  || '',
    appuis_rh:             body.appuisRH           || '',
    appuis_numerique:      body.appuisNumerique     || '',
  }, opt)

  // Section XIII — Observations (multiple)
  const obs = Array.isArray(body.observations) ? body.observations : []
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i]
    const text = typeof o === 'object' ? o.observation : o
    if (text && text.trim()) await RevueObservation.create({ revue_id, ordre: i + 1, observation: text.trim() }, opt)
  }

  // Section XIV — Signature
  await RevueSignature.create({
    revue_id,
    nom_signataire:      body.nomResponsable    || '',
    fonction_signataire: body.fonctionSignature || '',
    date_signature:      body.dateSignature || body.date || null,
    signature_image:     body.signatureImage    || null,
  }, opt)
}

// ─── POST /api/revues ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const body = req.body

    // 1. Trouver ou créer la direction
    const [direction] = await Direction.findOrCreate({
      where: { nom_direction: body.intituleDirection },
      defaults: {
        nom_direction:              body.intituleDirection,
        localisation_siege:         body.localisation         || '',
        email_officiel:             body.adresseEmail         || '',
        effectif_theorique:         Number(body.effectifTheorique) || null,
        mission_principale:         body.missionPrincipale         || '',
        principales_attributions:   body.principalesAttributions    || '',
        principaux_services_rendus: body.principauxServices        || '',
      },
      transaction: t,
    })

    // Mettre à jour les champs semi-fixes de la direction
    await direction.update({
      localisation_siege:         body.localisation               || direction.localisation_siege,
      email_officiel:             body.adresseEmail               || direction.email_officiel,
      effectif_theorique:         Number(body.effectifTheorique)  || direction.effectif_theorique,
      mission_principale:         body.missionPrincipale          || direction.mission_principale,
      principales_attributions:   body.principalesAttributions     || direction.principales_attributions,
      principaux_services_rendus: body.principauxServices         || direction.principaux_services_rendus,
    }, { transaction: t })

    // 2. Vérifier unicité direction + période
    const doublon = await Revue.findOne({
      where: {
        direction_id:  direction.direction_id,
        periode_debut: body.periodeDebut,
        periode_fin:   body.periodeFin,
      },
      transaction: t,
    })
    if (doublon) {
      await t.rollback()
      return res.status(409).json({
        message: `La direction "${body.intituleDirection}" a déjà soumis une fiche pour cette période.`,
      })
    }

    // 3. Créer la revue
    const revue = await Revue.create({
      direction_id:    direction.direction_id,
      soumis_par:      body.responsable || '',
      periode_debut:   body.periodeDebut,
      periode_fin:     body.periodeFin,
      date_reunion:    body.dateReunion,
      statut:          'soumis',
      date_soumission: new Date(),
    }, { transaction: t })

    // 4. Créer toutes les sous-tables
    await createSubtables(revue.revue_id, body, t)

    await t.commit()
    await audit({ action: 'CREATE', entity_type: 'revue', entity_id: revue.revue_id, entity_label: `${body.intituleDirection} (${body.periodeDebut} → ${body.periodeFin})`, req })
    res.status(201).json({ message: 'Revue enregistrée avec succès', id: revue.revue_id })
  } catch (err) {
    await t.rollback()
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/revues/check?direction=X&periode_debut=Y&periode_fin=Z ──────────
router.get('/check', async (req, res) => {
  try {
    const { direction, periode_debut, periode_fin } = req.query
    if (!direction || !periode_debut || !periode_fin) return res.json({ exists: false })
    const dir = await Direction.findOne({ where: { nom_direction: direction } })
    if (!dir) return res.json({ exists: false })
    const doublon = await Revue.findOne({
      where: { direction_id: dir.direction_id, periode_debut, periode_fin },
    })
    res.json({ exists: !!doublon })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/revues ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { direction, direction_id, mois } = req.query
    const where = {}
    const dirWhere = {}

    if (direction_id) where.direction_id = direction_id
    if (direction)    dirWhere.nom_direction = { [Op.like]: `%${direction}%` }
    if (mois) {
      where[Op.or] = [
        { periode_debut: { [Op.like]: `%${mois}%` } },
        { periode_fin:   { [Op.like]: `%${mois}%` } },
      ]
    }

    const revues = await Revue.findAll({
      where,
      include: [
        { model: Direction, as: 'direction', attributes: ['nom_direction', 'sigle'], where: dirWhere, required: !!direction },
      ],
      attributes: ['revue_id', 'direction_id', 'periode_debut', 'periode_fin', 'date_reunion', 'statut', 'date_soumission'],
      order: [['date_soumission', 'DESC']],
    })
    res.json(revues)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── GET /api/revues/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const revue = await Revue.findByPk(req.params.id, {
      include: [
        { model: Direction,                  as: 'direction' },
        { model: RevueRH,                    as: 'rh' },
        { model: RevueRepartitionPersonnel,  as: 'repartition_personnel' },
        { model: RevueBesoinsPersonnel,      as: 'besoins_personnel' },
        { model: RevueBesoinsFormation,      as: 'besoins_formation' },
        { model: RevueActivite,              as: 'activites' },
        { model: RevueResultat,              as: 'resultats' },
        { model: RevueDifficulteActivite,    as: 'difficultes_activites' },
        { model: RevueInfrastructure,        as: 'infrastructures' },
        { model: RevueTravailPrioritaire,    as: 'travaux_prioritaires' },
        { model: RevueEquipement,            as: 'equipements' },
        { model: RevueInsuffisancesMat,      as: 'insuffisances_materielles' },
        { model: RevueCommunication,         as: 'communication' },
        { model: RevueOutilNumerique,        as: 'outils_numeriques' },
        { model: RevueProcedureDematerialisee, as: 'procedures_dematerialisees' },
        { model: RevueProcedureManuelle,     as: 'procedures_manuelles' },
        { model: RevueBesoinDigitalisation,  as: 'besoins_digitalisation' },
        { model: RevueRapport,               as: 'rapports' },
        { model: RevueDernierRapport,        as: 'derniers_rapports' },
        { model: RevueLivrable,              as: 'livrables' },
        { model: RevueCauseDifficulteRapport, as: 'causes_difficultes_rapports' },
        { model: RevueContrainte,            as: 'contraintes', order: [['ordre', 'ASC']] },
        { model: RevueBesoinPrioritaire,     as: 'besoins_prioritaires', order: [['ordre', 'ASC']] },
        { model: RevueAction,                as: 'actions' },
        { model: RevueAppui,                 as: 'appuis' },
        { model: RevueObservation,           as: 'observations', order: [['ordre', 'ASC']] },
        { model: RevueSignature,             as: 'signature' },
      ],
    })
    if (!revue) return res.status(404).json({ message: 'Revue introuvable' })
    res.json(revue)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── PUT /api/revues/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const revue = await Revue.findByPk(req.params.id, { transaction: t })
    if (!revue) { await t.rollback(); return res.status(404).json({ message: 'Revue introuvable' }) }

    if (joursAvantReunion(revue.date_reunion) < 2) {
      await t.rollback()
      return res.status(403).json({
        message: 'La modification n\'est plus autorisée : la date limite (2 jours avant la réunion) est dépassée.',
      })
    }

    // Supprimer toutes les anciennes sous-tables
    const subModels = [
      RevueRH, RevueRepartitionPersonnel, RevueBesoinsPersonnel, RevueBesoinsFormation,
      RevueActivite, RevueResultat, RevueDifficulteActivite,
      RevueInfrastructure, RevueTravailPrioritaire,
      RevueEquipement, RevueInsuffisancesMat,
      RevueCommunication, RevueOutilNumerique, RevueProcedureDematerialisee,
      RevueProcedureManuelle, RevueBesoinDigitalisation,
      RevueRapport, RevueDernierRapport, RevueLivrable, RevueCauseDifficulteRapport,
      RevueContrainte, RevueBesoinPrioritaire,
      RevueAction, RevueAppui, RevueObservation, RevueSignature,
    ]
    for (const M of subModels) {
      await M.destroy({ where: { revue_id: revue.revue_id }, transaction: t })
    }

    // Recréer les sous-tables
    await createSubtables(revue.revue_id, req.body, t)

    // Mettre à jour les champs de la revue elle-même
    if (req.body.dateReunion) await revue.update({ date_reunion: req.body.dateReunion }, { transaction: t })

    await t.commit()
    await audit({ action: 'UPDATE', entity_type: 'revue', entity_id: revue.revue_id, entity_label: `${req.body.intituleDirection || revue.revue_id} (${req.body.periodeDebut || ''} → ${req.body.periodeFin || ''})`, req })
    res.json({ message: 'Revue mise à jour' })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// ─── DELETE /api/revues/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const revue = await Revue.findByPk(req.params.id)
    if (!revue) return res.status(404).json({ message: 'Revue introuvable' })
    const label = `revue ${revue.revue_id}`
    await revue.destroy()
    await audit({ action: 'DELETE', entity_type: 'revue', entity_id: req.params.id, entity_label: label, req })
    res.json({ message: 'Revue supprimée' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router
