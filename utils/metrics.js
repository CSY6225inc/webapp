const StatsD = require('hot-shots');
const metrics = new StatsD({
    host: 'localhost',
    port: 8125,
    prefix: 'webapp.',
    errorHandler: (error) => {
        console.error('Metrics error:', error);
    }
});

module.exports = metrics;