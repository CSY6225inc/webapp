const sequelize = require("../config/db.config");
const logger = require("../utils/logger");
const HealthCheck = require("./healthCheck");
const initalizeDatabase = async () => {
    try {
        await sequelize.authenticate();
        logger.info("Connected to DB");
        
        await sequelize.sync({ alter: true });
        logger.info("ORM authenticated and synchronized with DB");
    } catch (error) {
        logger.error("Error connecting to Database - ORM", error);
    }
}

module.exports = { initalizeDatabase, sequelize, HealthCheck };