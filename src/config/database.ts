import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/planets_db';

    try {
        await mongoose.connect(uri);
        console.log('Успішне підключення до MongoDB');
    } catch (error) {
        console.error('Помилка підключення до MongoDB:', error);
        process.exit(1);
    }
}

mongoose.connection.on('error', (err) => {
    console.error('MongoDB помилка під час роботи:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB відключено');
});