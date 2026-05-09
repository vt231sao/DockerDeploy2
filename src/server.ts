import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Сервер успішно запущено на порту ${PORT}`);
    });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    function gracefulShutdown(signal: string) {
        console.log(`\nОтримано ${signal}. Грасійне завершення роботи...`);
        server.close(async () => {
            console.log('HTTP сервер зупинено.');
            await mongoose.connection.close();
            console.log('Підключення до MongoDB закрито.');
            process.exit(0);
        });
    }
}

startServer();