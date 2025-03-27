const AWS = require("aws-sdk");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");
require('dotenv').config();

if (process.env.AWS_REGION) { logger.info("Got the region - connecting to bucket") }
else { logger.error("Couldn't find the AWS region from env") }

AWS.config.update({
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const monitoredS3 = {
    upload: (params) => {
        const start = Date.now();
        metrics.increment('s3.activity.attempt', 1, { activity: 'upload' });

        return s3.upload(params).promise()
            .then(data => {
                const duration = Date.now() - start;
                metrics.timing('s3.activity.time', duration, {
                    activity: 'upload',
                    status: 'success'
                });
                metrics.increment('s3.activity.success', 1, { activity: 'upload' });
                return data;
            })
            .catch(err => {
                const duration = Date.now() - start;
                metrics.timing('s3.activity.time', duration, {
                    activity: 'upload',
                    status: 'failed'
                });
                metrics.increment('s3.activity.failure', 1, { activity: 'upload' });
                throw err;
            });
    },

    deleteObject: (params) => {
        const start = Date.now();
        metrics.increment('s3.activity.attempt', 1, { activity: 'delete' });

        return s3.deleteObject(params).promise()
            .then(data => {
                const duration = Date.now() - start;
                metrics.timing('s3.activity.time', duration, {
                    activity: 'delete',
                    status: 'success'
                });
                metrics.increment('s3.activity.success', 1, { activity: 'delete' });
                return data;
            })
            .catch(err => {
                const duration = Date.now() - start;
                metrics.timing('s3.activity.time', duration, {
                    activity: 'delete',
                    status: 'failed'
                });
                metrics.increment('s3.activity.failure', 1, { activity: 'delete' });
                throw err;
            });
    }
};

s3.listBuckets((err, data) => {
    if (err) {
        logger.error("Credentials Error:", err);
        metrics.increment('s3.connection.error');
    }
    else {
        logger.info("Successfully connected to S3 with IAM role");
        metrics.increment('s3.connection.success');
    }
});

module.exports = {
    s3: monitoredS3,
    bucketName: process.env.S3_BUCKET_NAME
}