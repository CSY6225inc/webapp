const AWS = require("aws-sdk");
const logger = require("../utils/logger");
require('dotenv').config();

if (process.env.AWS_REGION) {logger.info("Got the region - connecting to bucket")}
else { logger.error("Couldn't find the AWS region from env")}

AWS.config.update({
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

s3.listBuckets((err, data) => {
    if (err) logger.error("Credentials Error:", err);
    else logger.info("Successfully connected to S3 with IAM role");
});

module.exports = {
    s3: s3,
    bucketName: process.env.S3_BUCKET_NAME
}