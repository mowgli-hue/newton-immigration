import { promises as fs } from 'fs';
import path from 'path';

export type NotificationPreferences = {
  userId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  studyRemindersEnabled: boolean;
  weeklyReportEnabled: boolean;
  onboardingEmailsEnabled: boolean;
  reminderDayOfWeek: number; // 0-6
  reminderHourLocal: number; // 0-23
  weeklyReportDayOfWeek: number; // 0-6
  weeklyReportHourLocal: number; // 0-23
  timezone?: string;
  createdAt: number;
  updatedAt: number;
  lastWelcomeEmailSentAt?: number;
  lastStudyReminderLocalDate?: string; // YYYY-MM-DD in user's timezone
  lastWeeklyReportLocalDate?: string; // YYYY-MM-DD in user's timezone
};

type NotificationPreferencesDb = {
  byUserId: Record<string, NotificationPreferences>;
};

const DATA_DIR = path.resolve(process.cwd(), '.local-data');
const DB_PATH = path.join(DATA_DIR, 'notification-preferences.json');

const DEFAULTS = {
  studyRemindersEnabled: true,
  weeklyReportEnabled: true,
  onboardingEmailsEnabled: true,
  reminderDayOfWeek: 1,
  reminderHourLocal: 19,
  weeklyReportDayOfWeek: 0,
  weeklyReportHourLocal: 18
} satisfies Pick<
  NotificationPreferences,
  | 'studyRemindersEnabled'
  | 'weeklyReportEnabled'
  | 'onboardingEmailsEnabled'
  | 'reminderDayOfWeek'
  | 'reminderHourLocal'
  | 'weeklyReportDayOfWeek'
  | 'weeklyReportHourLocal'
>;

let cache: NotificationPreferencesDb | null = null;

async function ensureDb(): Promise<NotificationPreferencesDb> {
  if (cache) return cache;

  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as NotificationPreferencesDb;
    cache = parsed && parsed.byUserId ? parsed : { byUserId: {} };
  } catch {
    cache = { byUserId: {} };
  }
  return cache;
}

async function persist(db: NotificationPreferencesDb): Promise<void> {
  cache = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function upsertNotificationPreferences(input: {
  userId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  timezone?: string;
  patch?: Partial<Omit<NotificationPreferences, 'userId' | 'email' | 'createdAt' | 'updatedAt'>>;
}): Promise<NotificationPreferences> {
  const db = await ensureDb();
  const now = Date.now();
  const existing = db.byUserId[input.userId];

  const next: NotificationPreferences = {
    ...DEFAULTS,
    ...existing,
    ...(input.patch ?? {}),
    userId: input.userId,
    email: input.email,
    displayName: input.displayName ?? existing?.displayName,
    emailVerified: input.emailVerified ?? existing?.emailVerified,
    timezone: input.timezone ?? existing?.timezone,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  db.byUserId[input.userId] = next;
  await persist(db);
  return next;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const db = await ensureDb();
  return db.byUserId[userId] ?? null;
}

export async function listNotificationPreferences(): Promise<NotificationPreferences[]> {
  const db = await ensureDb();
  return Object.values(db.byUserId);
}

export async function markWelcomeEmailSent(userId: string): Promise<void> {
  const db = await ensureDb();
  const existing = db.byUserId[userId];
  if (!existing) return;
  db.byUserId[userId] = {
    ...existing,
    lastWelcomeEmailSentAt: Date.now(),
    updatedAt: Date.now()
  };
  await persist(db);
}

export async function markStudyReminderSent(userId: string, localDate: string): Promise<void> {
  const db = await ensureDb();
  const existing = db.byUserId[userId];
  if (!existing) return;
  db.byUserId[userId] = {
    ...existing,
    lastStudyReminderLocalDate: localDate,
    updatedAt: Date.now()
  };
  await persist(db);
}

export async function markWeeklyReportSent(userId: string, localDate: string): Promise<void> {
  const db = await ensureDb();
  const existing = db.byUserId[userId];
  if (!existing) return;
  db.byUserId[userId] = {
    ...existing,
    lastWeeklyReportLocalDate: localDate,
    updatedAt: Date.now()
  };
  await persist(db);
}
