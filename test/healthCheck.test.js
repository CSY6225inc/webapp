const request = require('supertest');
const { HealthCheck, initalizeDatabase } = require('../models');
const server = require('../server');
const sequelize = require('../config/db.config');

describe('Health Check API', () => {
    beforeAll(async () => {
        await initalizeDatabase();
        // await sequelize.sync({ force: true });
    });
    
    afterEach(async () => {
        // await HealthCheck.destroy({ truncate: true });
        try {
            await sequelize.authenticate();
            await sequelize.truncate({ cascade: true })
        } catch (error) {
            console.log("DB not connected",error);
        }
    });
    
    afterAll(async () => {
        await sequelize.close();
    });
    
    describe('Successful Operations', () => {
        it('should return 200 OK with valid request', async () => {
            await request(server)
            .get('/healthz')
            .expect(200)
            .expect('Cache-Control', /no-cache/)
            .expect('Pragma', 'no-cache')
            .expect('X-Content-Type-Options', 'nosniff');
            
            const checks = await HealthCheck.findAll();
            expect(checks.length).toBe(1);
        });
    });
    
    describe('Client Errors', () => {
        it('should reject requests with body payload', async () => {
            await request(server)
            .get('/healthz')
            .send({ Bhuvan: 'Raj' })
            .expect(400)
            .expect('Cache-Control', /no-cache/);
        });
        it('should reject requests with query parameters', async () => {
            await request(server)
            .get('/healthz?question=answer')
            .expect(400)
        });
        it('should reject empty query parameters', async () => {
            await request(server)
            .get('/healthz?question=')
            .expect(400)
            .expect('Pragma', 'no-cache');
        });
        it('should reject malformed Content-Length headers', async () => {
            await request(server)
            .get('/healthz')
            .set('Content-Length', 'invalid')
            .expect(400);
        });
        it('should return 404 for unknown endpoints', async () => {
            await request(server)
            .get('/healthCheck')
            .expect(404)
            .expect('Cache-Control', /no-cache/);
        });
        it('should handle Content-Length: greater than 0 header', async () => {
            await request(server)
            .get('/healthz')
            .set('Content-Length', '1')
            .expect(400);
        });
    });
    
    describe('Method Validation', () => {
        it(`should reject Post requests`, async () => {
            await request(server)
            .post('/healthz')
            .expect(405)
            .expect('Cache-Control', /no-cache/)
            .expect('Pragma', 'no-cache')
            .expect('X-Content-Type-Options', 'nosniff');
        });
        it(`should reject Delete requests`, async () => {
            await request(server)
            .delete('/healthz')
            .expect(405)
            .expect('Cache-Control', /no-cache/)
            .expect('Pragma', 'no-cache')
            .expect('X-Content-Type-Options', 'nosniff');
        });
        it(`should reject patch requests`, async () => {
            await request(server)
            .patch('/healthz')
            .expect(405)
            .expect('Cache-Control', /no-cache/)
            .expect('Pragma', 'no-cache')
            .expect('X-Content-Type-Options', 'nosniff');
        });
        it(`should reject put requests`, async () => {
            await request(server)
            .put('/healthz')
            .expect(405)
            .expect('Cache-Control', /no-cache/)
            .expect('Pragma', 'no-cache')
            .expect('X-Content-Type-Options', 'nosniff');
        });
        it('should check for method first over payload', async () => {
            await request(server)
            .post('/healthz')
            .send({ key: 'value' })
            .query({ param: 'value' })
            .expect(405);
        });
        it('should maintain security headers on errors', async () => {
            await request(server)
                .get('/healthz?param=value')
                .expect(400)
                .expect('Cache-Control', /no-cache/)
                .expect('Pragma', 'no-cache')
                .expect('X-Content-Type-Options', 'nosniff');
            });
    });

    describe('Server Errors', () => {
        it('should return 503 when HealthChecks table is missing', async () => {;
            await sequelize.close()
            await request(server)
            .get('/healthz')
            .expect(503)
            .expect('Cache-Control', /no-cache/);
        });
        });
    });