import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Помилка валідації даних',
            errors: err.issues
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            status: 'error',
            message: 'Запис з такими унікальними даними вже існує'
        });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            status: 'error',
            message: `Невірний формат ідентифікатора для поля ${err.path}`
        });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            status: 'error',
            message: 'Помилка валідації бази даних',
            errors: messages
        });
    }

    console.error('Unhandled error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Внутрішня помилка сервера'
    });
};