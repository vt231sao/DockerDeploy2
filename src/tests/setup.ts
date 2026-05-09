import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// 1. Запуск сервера і підключення (викликається ОДИН раз перед усіма тестами)
export const connectDBForTesting = async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
};

// 2. Зупинка сервера (викликається ОДИН раз після всіх тестів)
export const closeDBForTesting = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
};

// 3. Очищення даних (викликається ПЕРЕД КОЖНИМ тестом)
export const clearDBForTesting = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};