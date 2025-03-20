
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { v4: uuidv4 } = require("uuid");
const FileCheck = require("../models/fileCheck");
const { s3, bucketName } = require("../config/s3");

router.post("/", upload.single('profilePic'), 
    (err, req, res, next) => {
        console.log(req);
        if (err instanceof multer.MulterError) {
            if (err.field !== 'profilePic') {
                console.log(err);
                return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                console.log(err);
                return res.status(400).json({ error: 'MMultiple files detected in profilePic field' });
            }
            return res.status(400).json({ error: err.message });
        }
            next();
    }, 
    async (request, response) => {
    if (!request.file) return response.status(400).json({ error: 'File has not been provided' });
    const fileID = uuidv4();
    const fileDetails = {
        Bucket: bucketName,
        Key: fileID,
        Body: request.file.buffer,
        ContentType: request.file.mimetype
    }
    // console.log(fileID,fileDetails);
    try {

        const s3ResponseData = await s3.upload(fileDetails).promise();

        const savedFile = await FileCheck.create({
            id: fileID,
            fileName: request.file.originalname,
            url: s3ResponseData?.Location,
            contentType: request.file.mimetype,
            contentLength: request.file.size,
            etag: s3ResponseData.ETag 
        })
        console.log(savedFile);
        return response.status(201).json({
            file_name: savedFile.fileName,
            id: savedFile.id,
            url: savedFile.url,
            upload_date: savedFile.uploadDate
        });

    } catch (error) {
        await s3.deleteObject({ Bucket: bucketName, Key: fileID }).promise().catch(console.error);
        response.status(500).json({ error: error.message })
    }
});

router.get("/:id", async (request, response) => {
    try {
        if (request.is('multipart/form-data')) {
            return response.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
        }
        if (request.query && Object.keys(request.query).length > 0) {
            return response.status(400).json({ error: 'Query parameters are not allowed' });
        }
        if (request.headers['content-length'] && parseInt(request.headers['content-length'], 10) > 0) {
            console.log('No Payload!!!');
            return response.status(400).send(); // Bad Request
        }

        const fileResponseData = await FileCheck.findByPk(request.params.id);
        console.log(fileResponseData);
        if (!fileResponseData) {
            return response.status(404).json({ error: 'File not found' })
        }
        return response.status(200).json({
            name: fileResponseData.fileName,
            identifier: fileResponseData.id,
            link: fileResponseData.url,
            uploaded_on: fileResponseData.uploadDate
        })
    } catch (error) {
        response.status(500).json({ error: error.message })
    }
});

router.delete("/:id", async (request, response) => {
    try {
        if (request.is('multipart/form-data')) {
            return response.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
        }
        if (request.query && Object.keys(request.query).length > 0) {
            return response.status(400).json({ error: 'Query parameters are not allowed' });
        }
        if (request.headers['content-length'] && parseInt(request.headers['content-length'], 10) > 0) {
            console.log('No Payload!!!');
            return response.status(400).send(); // Bad Request
        }
        
        const fileToRemove = await FileCheck.findByPk(request.params.id);
        if (!fileToRemove) {
            return response.status(400).json({ error: 'File not found' });
        }
        await s3.deleteObject({ Bucket: bucketName, Key: fileToRemove.id}).promise();

        await fileToRemove.destroy();
        response.status(204).end();
    } catch (error) {
        // if (error.code === 'NoSuchKey') {
        //     return response.status(404).json({ error: 'File not found in storage' });
        // }
        // if (error.name === 'UnauthorizedError') { 
            return response.status(401).json({ error: 'Unauthorized' });
        // }
        // return response.status(500).json({ error: error.message })
    }
})

router.all("*", (request, response) => {
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    return response.status(405).send();
});

module.exports = { fileRoutes: router };