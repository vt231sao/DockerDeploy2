import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            res.status(401).json({ message: 'Потрібна автентифікація' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        req.userId = decoded.userId;

        next();
    } catch (error) {
        res.status(401).json({ message: 'Недійсний токен' });
    }
};