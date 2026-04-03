/**
 * Modèles Sequelize — 29 tables normalisées
 * Référence : Cartographie_complete_professionnelle (document technique officiel)
 */
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const UUID  = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }
const TEXT  = { type: DataTypes.TEXT }
const TNN   = { type: DataTypes.TEXT, allowNull: false }
const STR   = (n) => ({ type: DataTypes.STRING(n) })
const INT   = { type: DataTypes.INTEGER }
const BOOL  = { type: DataTypes.BOOLEAN }
const DATE  = { type: DataTypes.DATEONLY }
const TS    = { type: DataTypes.DATE }
const fk    = (col) => ({ type: DataTypes.UUID, allowNull: false, field: col })

// ─── 1. directions ────────────────────────────────────────────────────────────
const Direction = sequelize.define('Direction', {
  direction_id:               { ...UUID },
  nom_direction:              { ...STR(255), allowNull: false, unique: true },
  sigle:                      { ...STR(50), defaultValue: null },
  mission_principale:         { ...TEXT, defaultValue: '' },
  principales_attributions:   { ...TEXT, defaultValue: '' },
  principaux_services_rendus: { ...TEXT, defaultValue: '' },
  localisation_siege:         { ...STR(255), defaultValue: '' },
  email_officiel:             { ...STR(255), defaultValue: '' },
  effectif_theorique:         { ...INT, defaultValue: null },
  statut:                     { ...STR(50), defaultValue: 'Actif' },
}, { tableName: 'directions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' })

// ─── 3. revues ────────────────────────────────────────────────────────────────
const Revue = sequelize.define('Revue', {
  revue_id:            { ...UUID },
  direction_id:        fk('direction_id'),
  soumis_par:          { type: DataTypes.STRING(255), defaultValue: null },
  periode_debut:       { ...DATE, allowNull: false },
  periode_fin:         { ...DATE, allowNull: false },
  date_reunion:        { ...DATE, allowNull: false },
  statut:              { ...STR(50), defaultValue: 'soumis' },
  date_soumission:     { ...TS, defaultValue: DataTypes.NOW },
  date_validation_dg:  { ...TS, defaultValue: null },
  commentaires_dg:     { ...TEXT, defaultValue: null },
}, { tableName: 'revues', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' })

// ─── 4. revue_ressources_humaines ─────────────────────────────────────────────
const RevueRH = sequelize.define('RevueRH', {
  id:                          { ...UUID },
  revue_id:                    fk('revue_id'),
  effectif_en_poste:           { ...INT },
  effectif_reellement_disponible: { ...INT },
  postes_vacants:              { ...INT },
  difficultes_rh:              { ...TEXT },
}, { tableName: 'revue_ressources_humaines', timestamps: false })

// ─── 5. revue_repartition_personnel ───────────────────────────────────────────
const RevueRepartitionPersonnel = sequelize.define('RevueRepartitionPersonnel', {
  id:        { ...UUID },
  revue_id:  fk('revue_id'),
  categorie: { ...STR(100) },
  nombre:    { ...INT },
}, { tableName: 'revue_repartition_personnel', timestamps: false })

// ─── 6. revue_besoins_personnel ───────────────────────────────────────────────
const RevueBesoinsPersonnel = sequelize.define('RevueBesoinsPersonnel', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  besoin:   { ...TEXT },
}, { tableName: 'revue_besoins_personnel', timestamps: false })

// ─── 7. revue_besoins_formation ───────────────────────────────────────────────
const RevueBesoinsFormation = sequelize.define('RevueBesoinsFormation', {
  id:              { ...UUID },
  revue_id:        fk('revue_id'),
  besoin_formation: { ...TEXT },
}, { tableName: 'revue_besoins_formation', timestamps: false })

// ─── 8. revue_activites ───────────────────────────────────────────────────────
const RevueActivite = sequelize.define('RevueActivite', {
  id:              { ...UUID },
  revue_id:        fk('revue_id'),
  type_activite:   { ...STR(50) }, // principale_realisee | en_cours | non_realisee
  description:     { ...TEXT },
  ordre_affichage: { ...INT, defaultValue: 1 },
}, { tableName: 'revue_activites', timestamps: false })

// ─── 9. revue_resultats ───────────────────────────────────────────────────────
const RevueResultat = sequelize.define('RevueResultat', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  resultat: { ...TEXT },
}, { tableName: 'revue_resultats', timestamps: false })

// ─── 10. revue_difficultes_activites ──────────────────────────────────────────
const RevueDifficulteActivite = sequelize.define('RevueDifficulteActivite', {
  id:         { ...UUID },
  revue_id:   fk('revue_id'),
  difficulte: { ...TEXT },
}, { tableName: 'revue_difficultes_activites', timestamps: false })

// ─── 11. revue_infrastructures ────────────────────────────────────────────────
const RevueInfrastructure = sequelize.define('RevueInfrastructure', {
  id:                    { ...UUID },
  revue_id:              fk('revue_id'),
  locaux_adaptes:        { ...BOOL },
  etat_general_batiments:{ ...STR(255) },
  niveau_exiguite:       { ...STR(255) },
  etat_proprete:         { ...STR(255) },
  signaletique_visible:  { ...BOOL },
  conditions_accueil:    { ...TEXT },
}, { tableName: 'revue_infrastructures', timestamps: false })

// ─── 12. revue_travaux_prioritaires ───────────────────────────────────────────
const RevueTravailPrioritaire = sequelize.define('RevueTravailPrioritaire', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  travail:  { ...TEXT },
}, { tableName: 'revue_travaux_prioritaires', timestamps: false })

// ─── 13. revue_equipements ────────────────────────────────────────────────────
const RevueEquipement = sequelize.define('RevueEquipement', {
  id:                       { ...UUID },
  revue_id:                 fk('revue_id'),
  mobilier_bureau:          { ...STR(255) },
  materiel_informatique:    { ...STR(255) },
  etat_informatique:        { ...STR(255) },
  disponibilite_electricite:{ ...STR(255) },
  disponibilite_internet:   { ...STR(255) },
  disponibilite_vehicules:  { ...STR(255) },
  autres_equipements:       { ...TEXT },
}, { tableName: 'revue_equipements', timestamps: false })

// ─── 14. revue_insuffisances_materielles ──────────────────────────────────────
const RevueInsuffisancesMat = sequelize.define('RevueInsuffisancesMat', {
  id:           { ...UUID },
  revue_id:     fk('revue_id'),
  insuffisance: { ...TEXT },
}, { tableName: 'revue_insuffisances_materielles', timestamps: false })

// ─── 15. revue_communication ──────────────────────────────────────────────────
const RevueCommunication = sequelize.define('RevueCommunication', {
  id:                        { ...UUID },
  revue_id:                  fk('revue_id'),
  circulation_information:   { ...TEXT },
  relations_autres_structures:{ ...TEXT },
  difficultes_informatiques: { ...TEXT },
}, { tableName: 'revue_communication', timestamps: false })

// ─── 16. revue_outils_numeriques ──────────────────────────────────────────────
const RevueOutilNumerique = sequelize.define('RevueOutilNumerique', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  outil:    { ...STR(255) },
}, { tableName: 'revue_outils_numeriques', timestamps: false })

// ─── 17. revue_procedures_dematerialisees ─────────────────────────────────────
const RevueProcedureDematerialisee = sequelize.define('RevueProcedureDematerialisee', {
  id:        { ...UUID },
  revue_id:  fk('revue_id'),
  procedure: { ...STR(255) },
}, { tableName: 'revue_procedures_dematerialisees', timestamps: false })

// ─── 18. revue_procedures_manuelles ───────────────────────────────────────────
const RevueProcedureManuelle = sequelize.define('RevueProcedureManuelle', {
  id:        { ...UUID },
  revue_id:  fk('revue_id'),
  procedure: { ...STR(255) },
}, { tableName: 'revue_procedures_manuelles', timestamps: false })

// ─── 19. revue_besoins_digitalisation ─────────────────────────────────────────
const RevueBesoinDigitalisation = sequelize.define('RevueBesoinDigitalisation', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  besoin:   { ...TEXT },
}, { tableName: 'revue_besoins_digitalisation', timestamps: false })

// ─── 20. revue_rapports ───────────────────────────────────────────────────────
const RevueRapport = sequelize.define('RevueRapport', {
  id:                      { ...UUID },
  revue_id:                fk('revue_id'),
  rapports_produits:       { ...BOOL },
  frequence_production:    { ...STR(50) },
  tableaux_bord_disponibles:{ ...BOOL },
  statistiques_disponibles:{ ...BOOL },
  retards_insuffisances:   { ...TEXT },
}, { tableName: 'revue_rapports', timestamps: false })

// ─── 21. revue_derniers_rapports ──────────────────────────────────────────────
const RevueDernierRapport = sequelize.define('RevueDernierRapport', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  rapport:  { ...STR(255) },
}, { tableName: 'revue_derniers_rapports', timestamps: false })

// ─── 22. revue_livrables ──────────────────────────────────────────────────────
const RevueLivrable = sequelize.define('RevueLivrable', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  livrable: { ...STR(255) },
}, { tableName: 'revue_livrables', timestamps: false })

// ─── 23. revue_causes_difficultes_rapports ────────────────────────────────────
const RevueCauseDifficulteRapport = sequelize.define('RevueCauseDifficulteRapport', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  cause:    { ...TEXT },
}, { tableName: 'revue_causes_difficultes_rapports', timestamps: false })

// ─── 24. revue_contraintes ────────────────────────────────────────────────────
const RevueContrainte = sequelize.define('RevueContrainte', {
  id:         { ...UUID },
  revue_id:   fk('revue_id'),
  ordre:      { ...INT },
  contrainte: { ...TEXT },
}, { tableName: 'revue_contraintes', timestamps: false })

// ─── 25. revue_besoins_prioritaires ───────────────────────────────────────────
const RevueBesoinPrioritaire = sequelize.define('RevueBesoinPrioritaire', {
  id:       { ...UUID },
  revue_id: fk('revue_id'),
  ordre:    { ...INT },
  besoin:   { ...TEXT },
}, { tableName: 'revue_besoins_prioritaires', timestamps: false })

// ─── 26. revue_actions ────────────────────────────────────────────────────────
const RevueAction = sequelize.define('RevueAction', {
  id:               { ...UUID },
  revue_id:         fk('revue_id'),
  mesures_internes: { ...TEXT },
  mesures_dg:       { ...TEXT },
  mesures_ministre: { ...TEXT },
}, { tableName: 'revue_actions', timestamps: false })

// ─── 27. revue_appuis ─────────────────────────────────────────────────────────
const RevueAppui = sequelize.define('RevueAppui', {
  id:                    { ...UUID },
  revue_id:              fk('revue_id'),
  decisions_souhaitees:  { ...TEXT },
  appuis_administratifs: { ...TEXT },
  appuis_logistiques:    { ...TEXT },
  appuis_rh:             { ...TEXT },
  appuis_numerique:      { ...TEXT },
}, { tableName: 'revue_appuis', timestamps: false })

// ─── 28. revue_observations ───────────────────────────────────────────────────
const RevueObservation = sequelize.define('RevueObservation', {
  id:          { ...UUID },
  revue_id:    fk('revue_id'),
  ordre:       { ...INT },
  observation: { ...TEXT },
}, { tableName: 'revue_observations', timestamps: false })

// ─── 29. revue_signature ──────────────────────────────────────────────────────
const RevueSignature = sequelize.define('RevueSignature', {
  id:                 { ...UUID },
  revue_id:           fk('revue_id'),
  nom_signataire:     { ...STR(255) },
  fonction_signataire:{ ...STR(255) },
  date_signature:     { ...DATE },
  signature_fichier:  { ...STR(255), defaultValue: null },
}, { tableName: 'revue_signature', timestamps: false })

// ─── Associations ─────────────────────────────────────────────────────────────
Direction.hasMany(Revue,  { foreignKey: 'direction_id', onDelete: 'CASCADE' })
Revue.belongsTo(Direction, { foreignKey: 'direction_id', as: 'direction' })

const SUB = [
  [RevueRH,                  'rh'],
  [RevueRepartitionPersonnel,'repartition_personnel'],
  [RevueBesoinsPersonnel,    'besoins_personnel'],
  [RevueBesoinsFormation,    'besoins_formation'],
  [RevueActivite,            'activites'],
  [RevueResultat,            'resultats'],
  [RevueDifficulteActivite,  'difficultes_activites'],
  [RevueInfrastructure,      'infrastructures'],
  [RevueTravailPrioritaire,  'travaux_prioritaires'],
  [RevueEquipement,          'equipements'],
  [RevueInsuffisancesMat,    'insuffisances_materielles'],
  [RevueCommunication,       'communication'],
  [RevueOutilNumerique,      'outils_numeriques'],
  [RevueProcedureDematerialisee,'procedures_dematerialisees'],
  [RevueProcedureManuelle,   'procedures_manuelles'],
  [RevueBesoinDigitalisation,'besoins_digitalisation'],
  [RevueRapport,             'rapports'],
  [RevueDernierRapport,      'derniers_rapports'],
  [RevueLivrable,            'livrables'],
  [RevueCauseDifficulteRapport,'causes_difficultes_rapports'],
  [RevueContrainte,          'contraintes'],
  [RevueBesoinPrioritaire,   'besoins_prioritaires'],
  [RevueAction,              'actions'],
  [RevueAppui,               'appuis'],
  [RevueObservation,         'observations'],
  [RevueSignature,           'signature'],
]

SUB.forEach(([Model, as]) => {
  Revue.hasMany(Model, { foreignKey: 'revue_id', as, onDelete: 'CASCADE' })
  Model.belongsTo(Revue, { foreignKey: 'revue_id' })
})

// hasOne aliases for single-record sub-tables
const SINGLE = [
  [RevueRH,           'rh_single'],
  [RevueInfrastructure,'infrastructure'],
  [RevueEquipement,   'equipement'],
  [RevueCommunication,'communication_single'],
  [RevueRapport,      'rapport'],
  [RevueAction,       'action'],
  [RevueAppui,        'appui'],
  [RevueSignature,    'signature_single'],
]
SINGLE.forEach(([Model, as]) => {
  Revue.hasOne(Model, { foreignKey: 'revue_id', as, onDelete: 'CASCADE' })
})

module.exports = {
  sequelize,
  Direction,
  Revue,
  RevueRH,
  RevueRepartitionPersonnel,
  RevueBesoinsPersonnel,
  RevueBesoinsFormation,
  RevueActivite,
  RevueResultat,
  RevueDifficulteActivite,
  RevueInfrastructure,
  RevueTravailPrioritaire,
  RevueEquipement,
  RevueInsuffisancesMat,
  RevueCommunication,
  RevueOutilNumerique,
  RevueProcedureDematerialisee,
  RevueProcedureManuelle,
  RevueBesoinDigitalisation,
  RevueRapport,
  RevueDernierRapport,
  RevueLivrable,
  RevueCauseDifficulteRapport,
  RevueContrainte,
  RevueBesoinPrioritaire,
  RevueAction,
  RevueAppui,
  RevueObservation,
  RevueSignature,
}
