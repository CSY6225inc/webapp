const express = require('express')
const { initalizeDatabase, HealthCheck, sequelize } = require('./models');
const app = express();

require("dotenv").config();

const { healthRoute } = require("./routes/healthroutes")
const { fileRoutes } = require("./routes/fileroutes")
const logger = require("./utils/logger");
const { requestLogger, errorHandler } = require('./middlewares/observability');

app.use(express.urlencoded({ extended: true }));

logger.info("Establishing connection to the DB")
initalizeDatabase();
logger.info("DB connection successful!")

//Iadded middlewares
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/v2/file", fileRoutes);
app.use(healthRoute);

app.use(errorHandler);

const server = app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
})

module.exports = server;