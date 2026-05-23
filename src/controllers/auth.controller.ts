import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ==========================================
// СХЕМИ ВАЛІДАЦІЇ (ZOD)
// ==========================================

// Валідація для реєстрації (коректна пошта + пароль мін. 6 символів)
const registerSchema = z.object({
    email: z.string().email('Некоректний формат email'),
    password: z.string().min(6, 'Пароль має бути не менше 6 символів')
});

// Валідація для логіну
const loginSchema = z.object({
    email: z.string().email('Некоректний формат email'),
    password: z.string()
});

// ==========================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ==========================================

// Функція для встановлення токенів у захищені httpOnly cookies
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const cookieOptions = {
        httpOnly: true,                  // Захист від XSS атак (JS не має доступу)
        secure: process.env.NODE_ENV === 'production', // true тільки на продакшні (HTTPS)
        sameSite: 'strict' as const      // Захист від CSRF атак
    };

    // Access token живе 15 хвилин, Refresh token — 30 днів
    res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

// ==========================================
// ЕНДПОЇНТИ
// ==========================================

/**
 * 1. РЕЄСТРАЦІЯ (POST /api/auth/register)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Валідація вхідних даних через Zod
        const { email, password } = registerSchema.parse(req.body);

        // Перевірка на існування дубліката
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Користувач з таким email вже існує' }); // 409 Conflict
            return;
        }

        // Створення користувача. Пароль захешується автоматично всередині моделі (pre-save hook)
        const newUser = new User({ email, password });
        await newUser.save();

        // Відповідь успішної реєстрації НЕ містить хеш пароля
        res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
        } else {
            res.status(500).json({ message: 'Помилка сервера під час реєстрації' });
        }
    }
};

/**
 * 2. ЛОГІН (POST /api/auth/login)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Валідація вхідних даних
        const { email, password } = loginSchema.parse(req.body);

        // Шукаємо користувача в базі даних
        const user = await User.findOne({ email }) as IUser | null;
        // Перевіряємо пароль за допомогою методу моделі (bcrypt.compare)
        // Якщо користувача немає або пароль не збігається — 401 Unauthorized без розкриття подробиць
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Неправильний email або пароль' });
            return;
        }

        // Генерація токенів (у payload кладемо тільки userId)
        const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Запікаємо токени в куки
        setTokenCookies(res, accessToken, refreshToken);

        // Тіло відповіді не містить токенів
        res.status(200).json({ message: 'Вхід успішний' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
        } else {
            res.status(500).json({ message: 'Помилка сервера при вході' });
        }
    }
};

/**
 * 3. ОНОВЛЕННЯ ТОКЕНІВ (POST /api/auth/refresh)
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        // Зчитуємо refresh_token з cookie
        const token = req.cookies.refresh_token;
        if (!token) {
            res.status(401).json({ message: 'Токен відсутній' });
            return;
        }

        // Верифікація підпису та строку дії токена
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Генеруємо нову пару токенів
        const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '30d' });

        // Оновлюємо cookies у клієнта
        setTokenCookies(res, newAccessToken, newRefreshToken);

        res.status(200).json({ message: 'Токени оновлено' });
    } catch (error) {
        res.status(401).json({ message: 'Недійсний або протермінований токен' });
    }
};

/**
 * 4. ВИХІД (POST /api/auth/logout)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    // Повністю очищаємо cookies з токенами
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Вихід успішний' });
};