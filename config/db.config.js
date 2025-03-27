const { Sequelize } = require('sequelize');
require('dotenv').config();
const logger = require("../utils/logger");

if (process.env.DB_PASSWORD) {
    logger.warn("checking if password exists in Application layer", Boolean(process.env.DB_PASSWORD));
} else {
    logger.error("DB password not present in env")
}

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging:false,
        // logging: (msg) => logger.debug(`SQL Query:${msg}`),
        // dialectOptions: {
        //     ssl: {
        //         require: true,
        //         rejectUnauthorized: false
        //     }
        // },
        // timezone: '-05:00'
        // timezone: '+00:00'
    },
);

module.exports = sequelize;