const express = require("express");

const { HealthCheck } = require("../models");

const router = express.Router();

router.get("/healthz", async (request, response) => {
    //check for request payload
    if (request.headers['content-length'] && parseInt(request.headers['content-length']) > 0) {
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        return response.status(400).send();
    }

    //check for payload
    if (Object.keys(request.query).length > 0) {
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');
        return response.status(400).end(); 
    }

    //status 200
    try {
        await HealthCheck.create({});

        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');

        return response.status(200).send();

    } catch (error) {
        console.error(error);

        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('X-Content-Type-Options', 'nosniff');

        return response.status(503).send();
    }
})

//all methods other than get handle with 405
router.all("/healthz", (request, response) => {
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');

    return response.status(405).send();
})

//all path except /healthz, endpoint doesn't exist 404
router.all("*", (request, response) => {
    response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('X-Content-Type-Options', 'nosniff');
    return response.status(404).send(); 
});

module.exports = { healthRoute: router };