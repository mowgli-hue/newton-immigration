import cors from 'cors';
import express from 'express';

import { healthRouter } from './api/http/routes/health.routes';
import { authRouter } from './api/http/routes/auth.routes';
import { learningRouter } from './api/http/routes/learning.routes';
import { notificationsRouter } from './api/http/routes/notifications.routes';
import { subscriptionRouter } from './api/http/routes/subscription.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/subscription', subscriptionRouter);

  return app;
}
