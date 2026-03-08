import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/signup', (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

authRouter.post('/login', (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});
