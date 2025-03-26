const AWS = require("aws-sdk");
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

s3.listBuckets((err, data) => {
    if (err) console.log("Credentials Error:", err);
    else console.log("Successfully connected to S3 with IAM role");
});

module.exports = {
    s3: s3,
    bucketName: process.env.S3_BUCKET_NAME
}