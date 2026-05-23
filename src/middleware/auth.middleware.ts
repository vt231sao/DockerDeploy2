import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Створюємо власний інтерфейс, який розширює стандартний Request
export interface AuthRequest extends Request {
    userId?: string;
}

// Використовуємо AuthRequest замість звичайного Request
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        // Читаємо access_token з кук
        const token = req.cookies.access_token;

        if (!token) {
            res.status(401).json({ message: 'Потрібна автентифікація' }); // 401 Unauthorized
            return;
        }

        // Верифікація токена
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Тепер TypeScript знає, що поле userId існує
        req.userId = decoded.userId;

        // Пропускаємо запит далі до контролера
        next();
    } catch (error) {
        // Якщо токен недійсний або протермінований — 401 без подробиць
        res.status(401).json({ message: 'Недійсний токен' });
    }
};