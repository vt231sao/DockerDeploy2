// src/types/express.d.ts

declare global {
    namespace Express {
        interface Request {
            userId?: string; // Додаємо наше поле userId
        }
    }
}

// Це потрібно, щоб TypeScript сприймав цей файл як модуль
export {};