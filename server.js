const express = require('express')
const { initalizeDatabase, HealthCheck, sequelize } = require('./models');
const app = express();

require("dotenv").config();

const { healthRoute } = require("./routes/healthroutes")
const { fileRoutes } = require("./routes/fileroutes")
const logger = require("./utils/logger");
const metrics = require("./utils/metrics");

app.use(express.urlencoded({ extended: true }));

logger.info("Establishing connection to the DB")
initalizeDatabase();
logger.info("DB connection successful!")

app.use("/v1/file", fileRoutes);
app.use(healthRoute);

app.use((request, response, next) => {
    const start = Date.now();
    request.on('finish', () => {
        const duration = Date.now() - start;
        metrics.timing('api_request_time', duration, {
            method: request.method,
            route: request.path
        });
        metrics.increment("api_call_count", 1, {
            method: request.method,
            route: request.path
        })
        logger.info({
            method: request.method,
            path: request.path,
            status: response.statusCode,
            duration: `${duration}ms`
        })
    });
    next();
})

app.use((error, request, response, next) => {
    logger.error({
        error: error.message,
        stack: error.stack,
        path: request.path,
        method: request.method
    }, 'Unhandled application error');
    metrics.increment('application_errors', 1, {
        path: request.path,
        method: request.method
    });
    response.status(500).json({ error: 'Internal sever error' })
})

const server = app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
})

module.exports = server;