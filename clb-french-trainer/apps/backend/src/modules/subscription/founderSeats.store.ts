import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), '.local-data');
const DB_PATH = path.join(DATA_DIR, 'subscription-state.json');
const DEFAULT_SEATS = 50;

type SubscriptionState = {
  founderSeatsRemaining: number;
  claimedByUserIds: string[];
};

let cache: SubscriptionState | null = null;

async function ensureState(): Promise<SubscriptionState> {
  if (cache) return cache;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SubscriptionState>;
    cache = {
      founderSeatsRemaining:
        typeof parsed.founderSeatsRemaining === 'number'
          ? Math.max(0, parsed.founderSeatsRemaining)
          : DEFAULT_SEATS,
      claimedByUserIds: Array.isArray(parsed.claimedByUserIds) ? parsed.claimedByUserIds : []
    };
  } catch {
    cache = { founderSeatsRemaining: DEFAULT_SEATS, claimedByUserIds: [] };
  }
  return cache;
}

async function persist(state: SubscriptionState): Promise<void> {
  cache = state;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export async function getFounderSeatsRemaining(): Promise<number> {
  const state = await ensureState();
  return state.founderSeatsRemaining;
}

export async function reserveFounderSeat(userId: string): Promise<{ ok: boolean; founderSeatsRemaining: number }> {
  const state = await ensureState();
  const uid = userId.trim();

  if (uid && state.claimedByUserIds.includes(uid)) {
    return { ok: true, founderSeatsRemaining: state.founderSeatsRemaining };
  }

  if (state.founderSeatsRemaining <= 0) {
    return { ok: false, founderSeatsRemaining: 0 };
  }

  const next: SubscriptionState = {
    founderSeatsRemaining: state.founderSeatsRemaining - 1,
    claimedByUserIds: uid ? [...state.claimedByUserIds, uid] : state.claimedByUserIds
  };
  await persist(next);
  return { ok: true, founderSeatsRemaining: next.founderSeatsRemaining };
}
