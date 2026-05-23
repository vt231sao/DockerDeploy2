import { Router, Request, Response, NextFunction } from 'express';
import { PlanetStorage } from '../storage/planet.storage';
import { validate } from '../middleware/validate.middleware';
import { createPlanetSchema, updatePlanetSchema } from '../schemas/planet.schema';
import { requireAuth } from '../middleware/auth.middleware';
import { Planet } from '../models/planet.model';

const router = Router();

// ==========================================
// РОЗШИРЕННЯ ТИПІВ ДЛЯ АВТОРИЗАЦІЇ
// ==========================================
// Створюємо власний інтерфейс, який каже TypeScript: "Тут точно буде userId"
interface AuthRequest<P = any> extends Request<P> {
    userId?: string;
}

// ==========================================
// СПЕЦИФІЧНИЙ МАРШРУТ (Важкі планети)
// ==========================================
router.get('/heavy', async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        next(error);
    }
});

// Використовуємо AuthRequest замість звичайного Request
router.post('/', requireAuth, validate(createPlanetSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        req.body.ownerId = req.userId;
        const newPlanet = await PlanetStorage.create(req.body);
        res.status(201).json(newPlanet);
    } catch (error) {
        next(error);
    }
});

// Використовуємо AuthRequest<{id: string}> для маршрутів з параметрами
router.patch('/:id', requireAuth, validate(updatePlanetSchema), async (req: AuthRequest<{id: string}>, res: Response, next: NextFunction) => {
    try {
        const planet = await Planet.findById(req.params.id);
        if (!planet) {
            return res.status(404).json({ message: 'Планету не знайдено' });
        }

        if (planet.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Доступ заборонено: ви не є власником цієї планети' });
        }

        const updatedPlanet = await PlanetStorage.update(req.params.id, req.body);
        res.status(200).json(updatedPlanet);
    } catch (error) {
        next(error);
    }
});

// Використовуємо AuthRequest<{id: string}>
router.delete('/:id', requireAuth, async (req: AuthRequest<{id: string}>, res: Response, next: NextFunction) => {
    try {
        const planet = await Planet.findById(req.params.id);
        if (!planet) {
            return res.status(404).json({ message: 'Планету не знайдено' });
        }

        if (planet.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Доступ заборонено: ви не є власником цієї планети' });
        }

        await PlanetStorage.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;