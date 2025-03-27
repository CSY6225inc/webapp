const express = require("express");

const { HealthCheck } = require("../models");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");
const router = express.Router();

const dbStart = Date.now();
router.head("/healthz", (request, response) => {
    metrics.increment('api.method.not_allowed', 1, { method: 'HEAD' });
    logger.warn("Unsupported method attemptaced for health check", {
        method: request.method,
        path: request.path
    });
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    metrics.timing('healthcheck.response_time', Date.now() - dbStart);
    return response.status(405).send();
})

router.get("/healthz", async (request, response) => {
    metrics.increment('healthcheck.request', 1);
    //check for request payload
    if (request.headers['content-length'] && parseInt(request.headers['content-length']) > 0) {
        metrics.increment('healthcheck.invalid_request', 1, { reason: 'content-length' });
        logger.warn("Invalid health check request with content-length", { contentLength: request.headers['content-length'] });
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        metrics.timing('api.duration.healthz', Date.now() - dbStart);
        return response.status(400).send();
    }

    //check for payload
    if (Object.keys(request.query).length > 0) {
        metrics.increment('healthcheck.invalid_request', 1, { reason: 'query-params' });
        logger.warn("Invalid health check request with query parameters", { queryParams: Object.keys(request.query) });
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        metrics.timing('api.duration.healthz', Date.now() - dbStart);
        return response.status(400).end();
    }

    //status 200
    try {
        
        logger.debug("Initiating database health check");
        await HealthCheck.create({});
        logger.info("Database health check successful");
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        logger.info("Healthz API has been hit")
        metrics.increment('healthcheck.success');
        metrics.timing('db.healthcheck.time', Date.now() - dbStart);
        return response.status(200).send();

    } catch (error) {
        metrics.increment('healthcheck.failure');
        logger.error("Database health check failed", {
            error: error.message,
            stack: error.stack,
        });

        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        metrics.increment('healthcheck.failure');
        metrics.timing('api.duration.healthz', Date.now() - dbStart);
        return response.status(503).send();
    }
})

//all methods other than get handle with 405
router.all("/healthz", (request, response) => {
    metrics.increment('api.method.not_allowed', 1, { method: request.method });
    logger.warn("Unsupported method attempted for health check", {
        method: request.method,
        path: request.path
    });
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    metrics.timing('api.duration.healthz', Date.now() - dbStart);
    return response.status(405).send();
})

//all path except /healthz, endpoint doesn't exist 404
router.all("*", (request, response) => {
    metrics.increment('api.invalid_route', 1, { method: request.method, path: request.originalUrl });
    logger.warn("Invalid route accessed", {
        method: request.method,
        path: request.originalUrl
    });
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    metrics.timing('api.duration.invalid_route', Date.now() - dbStart);
    return response.status(404).send();
});

module.exports = { healthRoute: router };
