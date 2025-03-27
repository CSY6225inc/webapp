const pino = require('pino');
const pcw = require('pino-cloudwatch');

// for develpment local logs
const devLogger = pino({
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
            customColors: 'error:red,warn:yellow,info:green,http:magenta,verbose:cyan,debug:blue,silly:white'
        }
    }
});

// Cloudwatch config for production
const prodLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: null,
    timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
    formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
        bindings: () => ({}), 
    },
    messageKey: 'message',
}, pcw({
    aws_region: process.env.AWS_REGION,
    group: '/csye6225-web-app/logs',
    stream: 'web-app',
    interval: 2000
}));

// environment variable for which logger to use
const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

module.exports = logger;