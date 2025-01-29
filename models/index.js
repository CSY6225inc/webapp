const sequelize = require("../config/db.config");
const HealthCheck = require("./healthCheck");
const initalizeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");
        
        await sequelize.sync({ alter: true });
        console.log("Synced DB");
    } catch (error) {
        console.log("Error connecting to Database", error);
    }
}

module.exports = { initalizeDatabase, sequelize, HealthCheck };