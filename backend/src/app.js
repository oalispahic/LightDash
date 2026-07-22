import express from 'express';
import cors from 'cors';
import { mountRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  mountRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
