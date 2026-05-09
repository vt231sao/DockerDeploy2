import express from 'express';
import cors from 'cors';
import planetRoutes from './routes/planet.routes';
import { errorHandler } from './middleware/error.middleware';
import mongoose from 'mongoose';
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/planets', planetRoutes);
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