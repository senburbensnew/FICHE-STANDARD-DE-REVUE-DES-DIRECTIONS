const mongoose = require('mongoose')

const ficheSchema = new mongoose.Schema({
  // I. Identification
  intituleDirection:     { type: String, required: true },
  responsable:           { type: String, required: true },
  fonction:              { type: String, required: true },
  dateReunion:           { type: String, required: true },
  periodeCoverte:        { type: String, required: true },
  localisation:          { type: String, required: true },
  coordonneesTel:        { type: String, required: true },
  adresseEmail:          { type: String, required: true },

  // II. Mission
  missionPrincipale:         { type: String, required: true },
  principalesAttributions:   { type: String, required: true },
  principauxServices:        { type: String, required: true },

  // III. Ressources humaines
  effectifTheorique:       { type: String, required: true },
  effectifPoste:           { type: String, required: true },
  effectifDisponible:      { type: String, required: true },
  repartitionPersonnel:    { type: String, required: true },
  postesVacants:           { type: String, required: true },
  besoinsPrioPersonnel:    { type: String, required: true },
  besoinsFormation:        { type: String, required: true },
  difficultesRH:           { type: String, required: true },

  // IV. Fonctionnement
  activitesRealisees:      { type: String, required: true },
  activitesEnCours:        { type: String, required: true },
  activitesNonRealisees:   { type: String, required: true },
  resultatsObtenus:        { type: String, required: true },
  difficultesExecution:    { type: String, required: true },

  // V. Locaux
  locauxAdaptes:           { type: String, required: true },
  etatBatiments:           { type: String, required: true },
  niveauExiguite:          { type: String, required: true },
  etatProprete:            { type: String, required: true },
  signaletique:            { type: String, required: true },
  conditionsAccueil:       { type: String, required: true },
  travauxPrioritaires:     { type: String, required: true },

  // VI. Équipements
  mobilierBureau:          { type: String, required: true },
  materielInformatique:    { type: String, required: true },
  etatOrdinateurs:         { type: String, required: true },
  electricite:             { type: String, required: true },
  internet:                { type: String, required: true },
  vehicules:               { type: String, required: true },
  autresEquipements:       { type: String, required: true },
  insuffisancesMaterielles:{ type: String, required: true },

  // VII. Communication
  circulationInfo:              { type: String, required: true },
  relationsAutresStructures:    { type: String, required: true },
  outilsNumeriques:             { type: String, required: true },
  proceduresDematerialisees:    { type: String, required: true },
  proceduresManuelles:          { type: String, required: true },
  besoinsDig:                   { type: String, required: true },
  difficultesInternet:          { type: String, required: true },

  // VIII. Rapports
  rapportsPeriodiques:        { type: String, required: true },
  frequenceProduction:        { type: String, required: true },
  derniersRapports:           { type: String, required: true },
  tableauxBord:               { type: String, required: true },
  statistiquesDisponibles:    { type: String, required: true },
  principauxLivrables:        { type: String, required: true },
  retardsRapports:            { type: String, required: true },
  causesRapports:             { type: String, required: true },

  // IX. Contraintes
  contrainte1: { type: String, required: true },
  contrainte2: { type: String, required: true },
  contrainte3: { type: String, required: true },

  // X. Besoins
  besoin1: { type: String, required: true },
  besoin2: { type: String, required: true },
  besoin3: { type: String, required: true },
  besoin4: { type: String, required: true },
  besoin5: { type: String, required: true },

  // XI. Mesures correctives
  mesuresStructure: { type: String, required: true },
  mesuresDG:        { type: String, required: true },
  mesuresMinistre:  { type: String, required: true },

  // XII. Appui
  decisionsOuhaitees:  { type: String, required: true },
  appuisAdmin:         { type: String, required: true },
  appuisLogistiques:   { type: String, required: true },
  appuisRH:            { type: String, required: true },
  appuisNumerique:     { type: String, required: true },

  // XIII. Observations
  observationsComplementaires: { type: String, required: true },

  // XIV. Signature
  nomResponsable:    { type: String, required: true },
  fonctionSignature: { type: String, required: true },
  date:              { type: String, required: true },
}, {
  timestamps: true,
})

module.exports = mongoose.model('Fiche', ficheSchema)
