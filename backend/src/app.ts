import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Maaza - International! The API is up and running smoothly. 🚀',
    timestamp: `Started at ${new Date().toLocaleString()}`,
  });
});

app.use(globalErrorHandler);
app.use(notFound)

export default app;
