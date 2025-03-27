const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const generalizeRoute = (path) => {
    return path
        .replace(/\/\d+(\/|$)/g, '/:id$1') 
        .replace(/\/[a-f0-9]{24}(\/|$)/gi, '/:id$1'); 
};

const requestLogger = (request, response, next) => {
    const start = Date.now();
    const rawRoute = request.baseUrl + request.path;
    const generalizedRoute = generalizeRoute(rawRoute);

    request.generalizedRoute = generalizedRoute;

    logger.debug({
        message: 'Request started',
        method: request.method,
        route: generalizedRoute, 
        rawRoute: rawRoute,
        query: request.query
    });

    response.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;
        const statusCategory = `${Math.floor(statusCode / 100)}xx`;

        const metricTags = {
            method: request.method,
            route: generalizedRoute, 
            status_category: statusCategory 
        };

        metrics.timing('api.request.time', duration, metricTags);
        metrics.increment('api.request.count', 1, metricTags);

        logger.info({
            message: 'Request completed',
            ...metricTags,
            duration_ms: duration,
            http: {
                user_agent: request.headers['user-agent'],
                status_code: statusCode
            }
        });
    });

    next();
};

const errorHandler = (err, request, response, next) => {
    const statusCode = err.statusCode || 500;
    const statusCategory = `${Math.floor(statusCode / 100)}xx`;
    const generalizedRoute = request.generalizedRoute || generalizeRoute(request.baseUrl + request.path);

    metrics.increment('application.errors', 1, {
        method: request.method,
        route: generalizedRoute, 
        error_type: err.name,
        status_category: statusCategory
    });

    logger.error({
        message: 'Application error',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        method: request.method,
        route: generalizedRoute,
        http: {
            status_code: statusCode
        }
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