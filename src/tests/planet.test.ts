import request from 'supertest';
import app from '../app';
import { connectDBForTesting, closeDBForTesting, clearDBForTesting } from './setup';

const validPlanet = {
    name: 'Earth',
    description: 'Our home',
    type: 'Terrestrial',
    massEarth: 1
};

describe('Planet REST API Integration Tests (MongoDB)', () => {
    let authCookie: string;

    beforeAll(async () => await connectDBForTesting());

    beforeEach(async () => {
        await clearDBForTesting();

        await request(app).post('/api/auth/register').send({
            email: 'testuser@mail.com',
            password: 'superpassword123'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'testuser@mail.com',
            password: 'superpassword123'
        });

        // БЕЗПЕЧНА ПЕРЕВІРКА ТИПІВ ДЛЯ COOKIES (вирішує проблему TS2352)
        const setCookieHeader = loginRes.headers['set-cookie'];
        let cookies: string[] = [];

        // Перевіряємо, чи це масив, чи звичайний рядок
        if (Array.isArray(setCookieHeader)) {
            cookies = setCookieHeader;
        } else if (typeof setCookieHeader === 'string') {
            cookies = [setCookieHeader];
        }

        authCookie = cookies.find(c => c.startsWith('access_token=')) || '';
    });

    afterAll(async () => await closeDBForTesting());

    describe('POST /api/planets', () => {
        it('повинен створити нову планету і повернути статус 201', async () => {
            const res = await request(app)
                .post('/api/planets')
                .set('Cookie', authCookie)
                .send(validPlanet)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(validPlanet.name);
            expect(res.body).toHaveProperty('massKg');
            expect(res.body).toHaveProperty('ownerId');
        });

        it('повинен повернути 401 Unauthorized, якщо запит без токена', async () => {
            await request(app).post('/api/planets').send(validPlanet).expect(401);
        });
    });

    describe('GET /api/planets', () => {
        it('повинен повернути порожній масив, якщо база чиста', async () => {
            const res = await request(app).get('/api/planets').expect(200);
            expect(res.body).toEqual([]);
        });

        it('повинен повернути всі створені планети з підтримкою пагінації', async () => {
            await request(app).post('/api/planets').set('Cookie', authCookie).send({ ...validPlanet, name: 'P1' });
            await request(app).post('/api/planets').set('Cookie', authCookie).send({ ...validPlanet, name: 'P2' });

            const res = await request(app).get('/api/planets?limit=1').expect(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('GET /api/planets/:id', () => {
        it('повинен повернути планету за правильним ID', async () => {
            const createRes = await request(app).post('/api/planets').set('Cookie', authCookie).send(validPlanet);
            const res = await request(app).get(`/api/planets/${createRes.body.id}`).expect(200);
            expect(res.body.id).toBe(createRes.body.id);
        });

        it('повинен повернути 400 (Bad Request), якщо формат ID невалідний для MongoDB', async () => {
            const res = await request(app).get('/api/planets/invalid-mongo-id-123').expect(400);
            expect(res.body.message).toContain('Невірний формат');
        });

        it('повинен повернути 404, якщо ID валідний, але планети немає', async () => {
            await request(app).get('/api/planets/507f1f77bcf86cd799439011').expect(404);
        });
    });

    describe('PATCH /api/planets/:id', () => {
        it('повинен успішно оновити лише передані поля', async () => {
            const createRes = await request(app).post('/api/planets').set('Cookie', authCookie).send(validPlanet);
            const res = await request(app)
                .patch(`/api/planets/${createRes.body.id}`)
                .set('Cookie', authCookie)
                .send({ name: 'Earth 2.0' })
                .expect(200);
            expect(res.body.name).toBe('Earth 2.0');
        });
    });

    describe('DELETE /api/planets/:id', () => {
        it('повинен видалити планету і повернути статус 204 No Content', async () => {
            const createRes = await request(app).post('/api/planets').set('Cookie', authCookie).send(validPlanet);
            await request(app)
                .delete(`/api/planets/${createRes.body.id}`)
                .set('Cookie', authCookie)
                .expect(204);

            await request(app).get(`/api/planets/${createRes.body.id}`).expect(404);
        });
    });
});