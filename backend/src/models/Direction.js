const mongoose = require('mongoose')

const directionSchema = new mongoose.Schema({
  nom:                    { type: String, required: true, unique: true, trim: true },
  responsable:            { type: String, default: '' },
  fonction:               { type: String, default: '' },
  localisation:           { type: String, default: '' },
  coordonneesTel:         { type: String, default: '' },
  adresseEmail:           { type: String, default: '' },
  missionPrincipale:      { type: String, default: '' },
  principalesAttributions:{ type: String, default: '' },
  principauxServices:     { type: String, default: '' },
}, {
  timestamps: true,
})

module.exports = mongoose.model('Direction', directionSchema)
