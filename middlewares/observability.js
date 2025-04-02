const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const requestLogger = (request, response, next) => {
    const start = Date.now();
    const fullRoute = request.baseUrl + request.path;
    // Request start logging
    logger.debug({
        incoming: `Incoming request: ${request.method} ${fullRoute}`,
        message: 'Request started',
        method: request.method,
        path: fullRoute,
        query: request.query,
        // headers:request.headers
    });

    // Response finish handler
    response.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;
        const statusCategory = `${Math.floor(statusCode / 100)}xx`;

        const metricTags = {
            incoming: `Outgoing response for: ${request.method} ${fullRoute}`,
            method: request.method,
            route: fullRoute,
            status_code: statusCode,
            status_category: statusCategory
        };

        metrics.timing('api.request.time', duration, metricTags);
        metrics.increment('api.request.count', 1, metricTags);

        logger.info({
            message: 'Request completed - sent response',
            ...metricTags,
            duration_ms: duration,
            user_agent: request.headers['user-agent']
        });
    });

    next();
};

const errorHandler = (err, request, response, next) => {
    const statusCode = err.statusCode || 500;
    const statusCategory = `${Math.floor(statusCode / 100)}xx`;
    const fullRoute = request.baseUrl + request.path;
    metrics.increment('application.errors', 1, {
        method: request.method,
        path: fullRoute,
        error_type: err.name,
        status_category: statusCategory
    });

    logger.error({
        message: 'Application error',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        status_code: statusCode,
        path: fullRoute
    });

    if (!response.headersSent) {
        response.status(statusCode).json({
            error: statusCode === 404 ? 'Resource not found' : 'Internal server error',
            ...(process.env.NODE_ENV !== 'production' && { details: err.message })
        });
    }
};

module.exports = {
    requestLogger,
    errorHandler
};