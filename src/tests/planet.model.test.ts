import { Planet } from '../models/planet.model';
import { connectDBForTesting, closeDBForTesting, clearDBForTesting } from './setup';

describe('Planet Mongoose Model Unit Tests', () => {

    beforeAll(async () => await connectDBForTesting());
    afterEach(async () => await clearDBForTesting());
    afterAll(async () => await closeDBForTesting());

    it('повинна успішно створити валідну планету', async () => {
        const planet = new Planet({
            name: 'Earth',
            type: 'Terrestrial',
            massEarth: 1
        });
        const savedPlanet = await planet.save();

        expect(savedPlanet._id).toBeDefined();
        expect(savedPlanet.name).toBe('Earth');
        expect(savedPlanet.createdAt).toBeDefined();
        expect(savedPlanet.updatedAt).toBeDefined();
    });

    it('повинна правильно рахувати віртуальне поле massKg', async () => {
        const planet = new Planet({
            name: 'Jupiter',
            type: 'Gas Giant',
            massEarth: 317.8
        });
        const savedPlanet = await planet.save();

        expect(savedPlanet.massKg).toBeDefined();
        expect(savedPlanet.massKg).toContain('kg');
    });

    it('повинна видати помилку валідації, якщо не вказано обов\'язкове поле (name)', async () => {
        const planet = new Planet({ type: 'Gas Giant', massEarth: 10 });
        let err: any;
        try {
            await planet.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.name).toBeDefined();
    });

    it('повинна спрацювати кастомна валідація для Dwarf Planet (маса < 0.1)', async () => {
        const pluto = new Planet({
            name: 'Pluto',
            type: 'Dwarf Planet',
            massEarth: 0.5
        });
        let err: any;
        try {
            await pluto.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.massEarth.message).toContain('Для Dwarf Planet маса має бути < 0.1');
    });
});