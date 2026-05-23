import express from 'express';
import cors from 'cors';
import planetRoutes from './routes/planet.routes';
import { errorHandler } from './middleware/error.middleware';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors());
app.use(express.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/api/planets', planetRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

app.get('/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
        res.status(200).json({ status: 'ok', database: 'connected' });
    } else {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});
export default app;