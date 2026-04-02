const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const T = DataTypes.TEXT   // shorthand — all content fields are TEXT

const Fiche = sequelize.define('Fiche', {
  // I. Identification
  intituleDirection:     { type: T, allowNull: false },
  responsable:           { type: T, allowNull: false },
  fonction:              { type: T, allowNull: false },
  dateReunion:           { type: T, allowNull: false },
  periodeCoverte:        { type: T, allowNull: false },
  localisation:          { type: T, allowNull: false },
  coordonneesTel:        { type: T, allowNull: false },
  adresseEmail:          { type: T, allowNull: false },

  // II. Mission
  missionPrincipale:         { type: T, allowNull: false },
  principalesAttributions:   { type: T, allowNull: false },
  principauxServices:        { type: T, allowNull: false },

  // III. Ressources humaines
  effectifTheorique:       { type: T, allowNull: false },
  effectifPoste:           { type: T, allowNull: false },
  effectifDisponible:      { type: T, allowNull: false },
  repartitionPersonnel:    { type: T, allowNull: false },
  postesVacants:           { type: T, allowNull: false },
  besoinsPrioPersonnel:    { type: T, allowNull: false },
  besoinsFormation:        { type: T, allowNull: false },
  difficultesRH:           { type: T, allowNull: false },

  // IV. Fonctionnement
  activitesRealisees:      { type: T, allowNull: false },
  activitesEnCours:        { type: T, allowNull: false },
  activitesNonRealisees:   { type: T, allowNull: false },
  resultatsObtenus:        { type: T, allowNull: false },
  difficultesExecution:    { type: T, allowNull: false },

  // V. Locaux
  locauxAdaptes:           { type: T, allowNull: false },
  etatBatiments:           { type: T, allowNull: false },
  niveauExiguite:          { type: T, allowNull: false },
  etatProprete:            { type: T, allowNull: false },
  signaletique:            { type: T, allowNull: false },
  conditionsAccueil:       { type: T, allowNull: false },
  travauxPrioritaires:     { type: T, allowNull: false },

  // VI. Équipements
  mobilierBureau:          { type: T, allowNull: false },
  materielInformatique:    { type: T, allowNull: false },
  etatOrdinateurs:         { type: T, allowNull: false },
  electricite:             { type: T, allowNull: false },
  internet:                { type: T, allowNull: false },
  vehicules:               { type: T, allowNull: false },
  autresEquipements:       { type: T, allowNull: false },
  insuffisancesMaterielles:{ type: T, allowNull: false },

  // VII. Communication
  circulationInfo:              { type: T, allowNull: false },
  relationsAutresStructures:    { type: T, allowNull: false },
  outilsNumeriques:             { type: T, allowNull: false },
  proceduresDematerialisees:    { type: T, allowNull: false },
  proceduresManuelles:          { type: T, allowNull: false },
  besoinsDig:                   { type: T, allowNull: false },
  difficultesInternet:          { type: T, allowNull: false },

  // VIII. Rapports
  rapportsPeriodiques:        { type: T, allowNull: false },
  frequenceProduction:        { type: T, allowNull: false },
  derniersRapports:           { type: T, allowNull: false },
  tableauxBord:               { type: T, allowNull: false },
  statistiquesDisponibles:    { type: T, allowNull: false },
  principauxLivrables:        { type: T, allowNull: false },
  retardsRapports:            { type: T, allowNull: false },
  causesRapports:             { type: T, allowNull: false },

  // IX. Contraintes
  contrainte1: { type: T, allowNull: false },
  contrainte2: { type: T, allowNull: false },
  contrainte3: { type: T, allowNull: false },

  // X. Besoins
  besoin1: { type: T, allowNull: false },
  besoin2: { type: T, allowNull: false },
  besoin3: { type: T, allowNull: false },
  besoin4: { type: T, allowNull: false },
  besoin5: { type: T, allowNull: false },

  // XI. Mesures correctives
  mesuresStructure: { type: T, allowNull: false },
  mesuresDG:        { type: T, allowNull: false },
  mesuresMinistre:  { type: T, allowNull: false },

  // XII. Appui
  decisionsOuhaitees:  { type: T, allowNull: false },
  appuisAdmin:         { type: T, allowNull: false },
  appuisLogistiques:   { type: T, allowNull: false },
  appuisRH:            { type: T, allowNull: false },
  appuisNumerique:     { type: T, allowNull: false },

  // XIII. Observations
  observationsComplementaires: { type: T, allowNull: false },

  // XIV. Signature
  nomResponsable:    { type: T, allowNull: false },
  fonctionSignature: { type: T, allowNull: false },
  date:              { type: T, allowNull: false },
}, {
  tableName:  'fiches',
  timestamps: true,
})

module.exports = Fiche
