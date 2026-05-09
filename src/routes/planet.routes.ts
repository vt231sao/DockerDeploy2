import { Router, Request, Response, NextFunction } from 'express';
import { PlanetStorage } from '../storage/planet.storage';
import { validate } from '../middleware/validate.middleware';
import { createPlanetSchema, updatePlanetSchema } from '../schemas/planet.schema';

const router = Router();

// ==========================================
// СПЕЦИФІЧНИЙ МАРШРУТ (Важкі планети)
// ==========================================
router.get('/heavy', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ВИПРАВЛЕНО: minMassEarth замість minMassEarths
        const heavyPlanets = await PlanetStorage.getAll({ minMassEarth: 10 });
        res.status(200).json(heavyPlanets);
    } catch (error) {
        next(error);
    }
});

// ==========================================
// CRUD МАРШРУТИ
// ==========================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, minMassEarth, page, limit, sortBy } = req.query;
        const planets = await PlanetStorage.getAll({
            type: type as string,
            // ВИПРАВЛЕНО: minMassEarth
            minMassEarth: minMassEarth ? Number(minMassEarth) : undefined,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy: sortBy as string
        });
        res.status(200).json(planets);
    } catch (error) {
        next(error);
    }
});
router.get('/:id', async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
        const planet = await PlanetStorage.getById(req.params.id);
        if (!planet) {
            return res.status(404).json({ message: 'Планету не знайдено' });
        }
        res.status(200).json(planet);
    } catch (error) {
        next(error); // Передаємо помилку (наприклад, неправильний формат ID) у глобальний обробник
    }
});

router.post('/', validate(createPlanetSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newPlanet = await PlanetStorage.create(req.body);
        res.status(201).json(newPlanet);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', validate(updatePlanetSchema), async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
        const updatedPlanet = await PlanetStorage.update(req.params.id, req.body);
        if (!updatedPlanet) {
            return res.status(404).json({ message: 'Планету не знайдено' });
        }
        res.status(200).json(updatedPlanet);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
        const isDeleted = await PlanetStorage.delete(req.params.id);
        if (!isDeleted) {
            return res.status(404).json({ message: 'Планету не знайдено' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;