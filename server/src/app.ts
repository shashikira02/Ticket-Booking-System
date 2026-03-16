import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import swaggerSpec from './config/swagger';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import bookingRoutes from './routes/bookingRoutes';

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for Swagger UI to load
app.use(cors({
  origin: (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173').split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '10kb' }));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', authRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', bookingRoutes);

const isProd = process.env.NODE_ENV === 'production';

app.use((err: { status?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err: String(err.message) }, 'Request error');
  res.status(err.status ?? 500).json({
    error: isProd ? 'Internal Server Error' : (err.message ?? 'Internal Server Error'),
  });
});

export default app;
