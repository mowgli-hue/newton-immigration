import { Router } from 'express';
import { z } from 'zod';

import { getFounderSeatsRemaining, reserveFounderSeat } from '../../../modules/subscription/founderSeats.store';

export const subscriptionRouter = Router();

const activateFounderSchema = z.object({
  userId: z.string().trim().min(1).default('guest')
});

subscriptionRouter.get('/founder-seats', async (_req, res) => {
  try {
    const founderSeatsRemaining = await getFounderSeatsRemaining();
    return res.json({ founderSeatsRemaining });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

subscriptionRouter.post('/activate-founder', async (req, res) => {
  try {
    const { userId } = activateFounderSchema.parse(req.body ?? {});
    const result = await reserveFounderSeat(userId);

    if (!result.ok) {
      return res.status(409).json({
        ok: false,
        reason: 'sold_out',
        founderSeatsRemaining: result.founderSeatsRemaining
      });
    }

    return res.json({
      ok: true,
      founderSeatsRemaining: result.founderSeatsRemaining
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(400).json({ message });
  }
});
