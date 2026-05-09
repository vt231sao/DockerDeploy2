import request from 'supertest';
import app from '../app';
import { connectDBForTesting, closeDBForTesting, clearDBForTesting } from './setup';

const validPlanet = {
    name: 'Earth',
    description: 'Our home',
    type: 'Terrestrial',
    massEarth: 1
};

const heavyPlanet = {
    name: 'Jupiter',
    type: 'Gas Giant',
    massEarth: 317.8
};

describe('Planet REST API Integration Tests (MongoDB)', () => {
    beforeAll(async () => await connectDBForTesting());
    afterEach(async () => await clearDBForTesting());
    afterAll(async () => await closeDBForTesting());

    describe('POST /api/planets', () => {
        it('повинен створити нову планету і повернути статус 201', async () => {
            const res = await request(app).post('/api/planets').send(validPlanet).expect(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(validPlanet.name);
            expect(res.body).toHaveProperty('massKg');
        });

    });

    describe('GET /api/planets', () => {
        it('повинен повернути порожній масив, якщо база чиста', async () => {
            const res = await request(app).get('/api/planets').expect(200);
            expect(res.body).toEqual([]);
        });

        it('повинен повернути всі створені планети з підтримкою пагінації', async () => {
            await request(app).post('/api/planets').send({ ...validPlanet, name: 'P1' });
            await request(app).post('/api/planets').send({ ...validPlanet, name: 'P2' });

            const res = await request(app).get('/api/planets?limit=1').expect(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('GET /api/planets/:id', () => {
        it('повинен повернути планету за правильним ID', async () => {
            const createRes = await request(app).post('/api/planets').send(validPlanet);
            const res = await request(app).get(`/api/planets/${createRes.body.id}`).expect(200);
            expect(res.body.id).toBe(createRes.body.id);
        });

        it('повинен повернути 400 (Bad Request), якщо формат ID невалідний для MongoDB', async () => {
            const res = await request(app).get('/api/planets/invalid-mongo-id-123').expect(400);
            expect(res.body.message).toContain('Невірний формат ідентифікатора');
        });

        it('повинен повернути 404, якщо ID валідний, але планети немає', async () => {
            await request(app).get('/api/planets/507f1f77bcf86cd799439011').expect(404);
        });
    });

    describe('PATCH /api/planets/:id', () => {
        it('повинен успішно оновити лише передані поля', async () => {
            const createRes = await request(app).post('/api/planets').send(validPlanet);
            const res = await request(app)
                .patch(`/api/planets/${createRes.body.id}`)
                .send({ name: 'Earth 2.0' })
                .expect(200);
            expect(res.body.name).toBe('Earth 2.0');
        });
    });

    describe('DELETE /api/planets/:id', () => {
        it('повинен видалити планету і повернути статус 204 No Content', async () => {
            const createRes = await request(app).post('/api/planets').send(validPlanet);
            await request(app).delete(`/api/planets/${createRes.body.id}`).expect(204);
            await request(app).get(`/api/planets/${createRes.body.id}`).expect(404);
        });
    });
});