import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import config from './app/config';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import securityHeaders from './app/middlewares/securityHeaders';
import { rateLimit } from './app/middlewares/rateLimit';

const app = express();

// Behind a reverse proxy (nginx, Render, etc.) set TRUST_PROXY=1 so req.ip is the real client IP
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false);

app.use(securityHeaders);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: config.cors_origins,
    credentials: true,
  })
);

// Brute-force protection on auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Try again in 15 minutes.' });
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forget-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
app.use('/api/v1/users/create-user', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'Too many registrations from this IP.' }));

app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Maaza - International! The API is up and running smoothly. 🚀',
    timestamp: `Started at ${new Date().toLocaleString()}`,
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
