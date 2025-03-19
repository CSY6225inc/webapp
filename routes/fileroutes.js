
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { v4: uuidv4 } = require("uuid");
const FileCheck = require("../models/fileCheck");
const { s3, bucketName } = require("../config/s3");

router.post("/", upload.single('profilePic'), async (request, response) => {
    if (!request.file) return response.status(400).json({ error: 'File has not been provided' });

    const fileID = uuidv4();
    const fileDetails = {
        Bucket: bucketName,
        Key: fileID,
        Body: request.file.buffer,
        ContentType: request.file.mimetype
    }
    console.log(fileID,fileDetails);
    try {

        const s3ResponseData = await s3.upload(fileDetails).promise();

        const savedFile = await FileCheck.create({
            id: fileID,
            fileName: request.file.originalname,
            url: s3ResponseData?.Location,
            ContentType: request.file.mimetype,
            ContentLength: request.file.size,
            etag: s3ResponseData?.Etag
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
        const fileToRemove = await FileCheck.findByPk(request.params.id);
        if (!fileToRemove) {
            return response.status(404).json({ error: 'File not found' });
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
    return response.status(404).send();
});

module.exports = { fileRoutes: router };