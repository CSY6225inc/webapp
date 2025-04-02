const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const logRequest = (req, res, next) => {
    const requestStart = Date.now();
    const completePath = req.baseUrl + req.path;

    logger.debug({
        event: `Receiving ${req.method} request`,
        endpoint: completePath,
        requestDetails: {
            method: req.method,
            fullPath: completePath,
            queryParams: req.query
        }
    });

    res.on('finish', () => {
        const processingTime = Date.now() - requestStart;
        const responseStatus = res.statusCode;
        const statusGroup = `${Math.floor(responseStatus / 100)}xx`;

        const performanceMetrics = {
            event: `Completed ${req.method} request`,
            method: req.method,
            endpoint: completePath,
            responseCode: responseStatus,
            responseGroup: statusGroup
        };

        metrics.timing('server.request.processingTime', processingTime, performanceMetrics);
        metrics.increment('server.request.totalCount', 1, performanceMetrics);

        logger.info({
            ...performanceMetrics,
            processingDuration: processingTime,
            clientAgent: req.headers['user-agent']
        });
    });

    next();
};

const handleServerErrors = (error, req, res, next) => {
    const responseCode = error.statusCode || 500;
    const statusGroup = `${Math.floor(responseCode / 100)}xx`;
    const completePath = req.baseUrl + req.path;

    metrics.increment('system.errorOccurrences', 1, {
        method: req.method,
        endpoint: completePath,
        errorType: error.name,
        statusCategory: statusGroup
    });

    logger.error({
        errorMessage: 'System error encountered',
        details: error.message,
        stackTrace: process.env.ENVIRONMENT === 'production' ? undefined : error.stack,
        responseStatus: responseCode,
        affectedPath: completePath
    });

    if (!res.headersSent) {
        res.status(responseCode).json({
            errorMessage: responseCode === 404 ? 'Requested resource not available' : 'Server processing error',
            ...(process.env.ENVIRONMENT !== 'production' && { errorDetails: error.message })
        });
    }
};

module.exports = {
    logRequest,
    handleServerErrors
};