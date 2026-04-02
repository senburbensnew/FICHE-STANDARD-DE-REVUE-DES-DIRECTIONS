const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.MYSQL_DB   || 'mef_fiches',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASS || '',
  {
    host:    process.env.MYSQL_HOST || 'localhost',
    port:    parseInt(process.env.MYSQL_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
  }
)

module.exports = sequelize
