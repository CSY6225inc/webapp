const { Sequelize } = require('sequelize');
require('dotenv').config();
console.log("checking if password exists in Application layer",Boolean(process.env.DB_PASSWORD));
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging:false
        // timezone: '-05:00'
        // timezone: '+00:00'
    },
);

module.exports = sequelize;