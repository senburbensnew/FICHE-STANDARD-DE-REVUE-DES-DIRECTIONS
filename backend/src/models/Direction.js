const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Direction = sequelize.define('Direction', {
  nom:                    { type: DataTypes.STRING(512), allowNull: false, unique: true },
  responsable:            { type: DataTypes.STRING(255), defaultValue: '' },
  fonction:               { type: DataTypes.STRING(255), defaultValue: '' },
  localisation:           { type: DataTypes.STRING(255), defaultValue: '' },
  coordonneesTel:         { type: DataTypes.STRING(50),  defaultValue: '' },
  adresseEmail:           { type: DataTypes.STRING(255), defaultValue: '' },
  missionPrincipale:      { type: DataTypes.TEXT,        defaultValue: '' },
  principalesAttributions:{ type: DataTypes.TEXT,        defaultValue: '' },
  principauxServices:     { type: DataTypes.TEXT,        defaultValue: '' },
}, {
  tableName:  'directions',
  timestamps: true,
})

module.exports = Direction
