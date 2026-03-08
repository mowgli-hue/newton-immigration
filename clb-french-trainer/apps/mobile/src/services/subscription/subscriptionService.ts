import { env } from '../../core/config/env';

const DEFAULT_FOUNDER_SEATS = 50;

export async function fetchFounderSeatsRemaining(): Promise<number> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/subscription/founder-seats`);
    if (!response.ok) return DEFAULT_FOUNDER_SEATS;
    const data = (await response.json()) as { founderSeatsRemaining?: number };
    const seats = Number(data.founderSeatsRemaining);
    return Number.isFinite(seats) ? Math.max(0, seats) : DEFAULT_FOUNDER_SEATS;
  } catch {
    return DEFAULT_FOUNDER_SEATS;
  }
}

export async function reserveFounderSeat(
  userId?: string
): Promise<{ ok: boolean; seatsRemaining: number; reason?: 'sold_out' | 'failed' }> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/subscription/activate-founder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId ?? 'guest' })
    });
    if (response.status === 409) {
      const soldOut = (await response.json()) as { founderSeatsRemaining?: number };
      return {
        ok: false,
        reason: 'sold_out',
        seatsRemaining: Math.max(0, Number(soldOut.founderSeatsRemaining ?? 0))
      };
    }
    if (!response.ok) {
      const fallbackSeats = await fetchFounderSeatsRemaining();
      return { ok: false, reason: 'failed', seatsRemaining: fallbackSeats };
    }
    const data = (await response.json()) as { founderSeatsRemaining?: number };
    return {
      ok: true,
      seatsRemaining: Math.max(0, Number(data.founderSeatsRemaining ?? DEFAULT_FOUNDER_SEATS))
    };
  } catch {
    const fallbackSeats = await fetchFounderSeatsRemaining();
    return { ok: false, reason: 'failed', seatsRemaining: fallbackSeats };
  }
}
