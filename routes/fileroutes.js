
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { v4: uuidv4 } = require("uuid");
const FileCheck = require("../models/fileCheck");
const { s3, bucketName } = require("../config/s3");
const logger = require("../utils/logger");
const metrics =require("../utils/metrics");

router.head("/:id", (request, response) => {
    metrics.increment('api.method.not_allowed', 1, { method: 'HEAD' });
    logger.warn("Unsupported method attempted for v1/file/", {
        method: request.method,
        path: request.path
    });
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');

    return response.status(405).send();
})

router.post("/", upload.single('profilePic'), 
    (err, req, res, next) => {
        logger.warn("Multer error occurred in file upload - invalid headers present", { error: err.message, code: err.code });
        if (err instanceof multer.MulterError) {
            if (err.field !== 'profilePic') {
                metrics.increment('client.error', 1, { operation: 'upload', reason: 'invalid_field' });
                logger.warn("Invalid field name used in headers", { attemptedField: err.field });
                return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                metrics.increment('client.error', 1, { operation: 'upload', reason: 'multiple_files' });
                logger.warn("Multiple files detected in upload", { field: err.field });
                return res.status(400).json({ error: 'MMultiple files detected in profilePic field' });
            }
            metrics.increment('client.error', 1, { operation: 'upload', reason: 'multer_error' });
            logger.warn("Multer upload error", { error: err.message });
            return res.status(400).json({ error: err.message });
        }
            next();
    }, 
    async (request, response) => {
    const startTime = Date.now();
    metrics.increment('file.operation.attempt', 1, { operation: 'upload' });
    if (!request.file) {
        metrics.increment('client.error', 1, { operation: 'upload', reason: 'missing_file' });
        logger.warn("File upload attempt without file");
        return response.status(400).json({ error: 'File has not been provided' });
    }
    const fileID = uuidv4();
    const fileDetails = {
        Bucket: bucketName,
        Key: fileID,
        Body: request.file.buffer,
        ContentType: request.file.mimetype
    }
    try {
        logger.info("Starting file upload to S3", { fileId: fileID, fileName: request.file.originalname });
        const s3ResponseData = await s3.upload(fileDetails);
        logger.debug("S3 upload successful", { fileId: fileID, etag: s3ResponseData.ETag });
        const savedFile = await FileCheck.create({
            id: fileID,
            fileName: request.file.originalname,
            url: s3ResponseData?.Location,
            contentType: request.file.mimetype,
            contentLength: request.file.size,
            etag: s3ResponseData.ETag 
        })
        metrics.increment('file.operation.success', 1, { operation: 'upload' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'upload', status: 'success' });
        logger.info("File record created successfully", { fileId: fileID });
        return response.status(201).json({
            file_name: savedFile.fileName,
            id: savedFile.id,
            url: savedFile.url,
            upload_date: savedFile.uploadDate
        });

    } catch (error) {
        metrics.increment('file.operation.failure', 1, { operation: 'upload' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'upload', status: 'failure' });
        logger.error("File upload failed", { error: error.message, fileId: fileID });
        await s3.deleteObject({ Bucket: bucketName, Key: fileID }).catch(console.error);
        logger.error("Failed to clean up S3 after failed upload", { fileId: fileID, error: deleteError.message });
        response.status(500).json({ error: error.message })
    }
});

router.get("/:id", async (request, response) => {
    const startTime = Date.now();
    metrics.increment('file.operation.attempt', 1, { operation: 'get' });
    try {
        if (request.is('multipart/form-data')) {
            metrics.increment('client.error', 1, { operation: 'get', reason: 'invalid_content_type' });
            logger.warn("Invalid content-type - multipart/form-data for GET request", { contentType: 'multipart/form-data', fileId: request.params.id });
            return response.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
        }
        if (request.query && Object.keys(request.query).length > 0) {
            metrics.increment('client.error', 1, { operation: 'get', reason: 'query_parameters' });
            logger.warn("Query parameters present in GET request", { fileId: request.params.id, queryParams: Object.keys(request.query) });
            return response.status(400).json({ error: 'Query parameters are not allowed' });
        }
        if (request.headers['content-length'] && parseInt(request.headers['content-length'], 10) > 0) {
            metrics.increment('client.error', 1, { operation: 'get', reason: 'content_length' });
            logger.warn("GET request with payload content", { fileId: request.params.id, contentLength: request.headers['content-length'] });
            return response.status(400).send(); // Bad Request
        }
        logger.info("Fetching file record", { fileId: request.params.id });
        const fileResponseData = await FileCheck.findByPk(request.params.id);

        if (!fileResponseData) {
            metrics.increment('file.operation.not_found', 1, { operation: 'get' });
            logger.warn("File not found", { fileId: request.params.id });
            return response.status(404).json({ error: 'File not found' })
        }
        metrics.increment('file.operation.success', 1, { operation: 'get' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'get', status: 'success' });
        logger.info("File retrieved successfully", { fileId: request.params.id });
        return response.status(200).json({
            name: fileResponseData.fileName,
            identifier: fileResponseData.id,
            link: fileResponseData.url,
            uploaded_on: fileResponseData.uploadDate
        })
    } catch (error) {
        metrics.increment('file.operation.failure', 1, { operation: 'get' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'get', status: 'failure' });
        logger.error("Error retrieving file", { error: error.message, fileId: request.params.id });
        response.status(500).json({ error: error.message })
    }
});

router.delete("/:id", async (request, response) => {
    const startTime = Date.now();
    metrics.increment('file.operation.attempt', 1, { operation: 'delete' });
    try {
        if (request.is('multipart/form-data')) {
            metrics.increment('client.error', 1, { operation: 'delete', reason: 'invalid_content_type' });
            logger.warn("Invalid content-type - multipart/form-data for DELETE request", { contentType: 'multipart/form-data', fileId: request.params.id });
            return response.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
        }
        if (request.query && Object.keys(request.query).length > 0) {
            metrics.increment('client.error', 1, { operation: 'delete', reason: 'query_parameters' });
            logger.warn("Query parameters present in DELETE request", { fileId: request.params.id, queryParams: Object.keys(request.query) });
            return response.status(400).json({ error: 'Query parameters are not allowed' });
        }
        if (request.headers['content-length'] && parseInt(request.headers['content-length'], 10) > 0) {
            metrics.increment('client.error', 1, { operation: 'delete', reason: 'content_length' });
            logger.warn("DELETE request with payload content", { fileId: request.params.id, contentLength: request.headers['content-length'] });
            return response.status(400).send(); // Bad Request
        }
        logger.info("Processing file deletion", { fileId: request.params.id });
        const fileToRemove = await FileCheck.findByPk(request.params.id);
        if (!fileToRemove) {
            metrics.increment('file.operation.not_found', 1, { operation: 'delete' });
            logger.warn("File not found for deletion", { fileId: request.params.id });
            return response.status(400).json({ error: 'File not found' });
        }
        logger.debug("Deleting file from S3", { fileId: request.params.id });
        await s3.deleteObject({ Bucket: bucketName, Key: fileToRemove.id});
        logger.debug("Deleting database record", { fileId: request.params.id });
        await fileToRemove.destroy();
        metrics.increment('file.operation.success', 1, { operation: 'delete' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'delete', status: 'success' });
        logger.info("File deleted successfully", { fileId: request.params.id });
        response.status(204).end();
    } catch (error) {
        metrics.increment('file.operation.failure', 1, { operation: 'delete' });
        metrics.timing('file.operation.time', Date.now() - startTime, { operation: 'delete', status: 'failure' });
        logger.error("File deletion failed", { error: error.message, fileId: request.params.id });
        // if (error.code === 'NoSuchKey') {
        //     return response.status(404).json({ error: 'File not found in storage' });
        // }
        // if (error.name === 'UnauthorizedError') { 
            return response.status(401).json({ error: 'Unauthorized' });
        // }
        // return response.status(500).json({ error: error.message })
    }
})

router.get("/", async(request,response)=>{
    metrics.increment('client.error', 1, { reason: 'base_endpoint_access' });
    logger.warn("Invalid GET request to base files endpoint without /:id");
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    return response.status(400).send();
})

router.delete("/", async (request, response) => {
    metrics.increment('client.error', 1, { reason: 'base_endpoint_access' });
    logger.warn("Invalid DELETE request to base files endpoint without /:id");
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    return response.status(400).send();
})

router.all("*", (request, response) => {
    metrics.increment('api.method.invalid', 1, { method: request.method });
    logger.warn("Invalid method or route accessed", { method: request.method, path: request.path });
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    return response.status(405).send();
});

module.exports = { fileRoutes: router };