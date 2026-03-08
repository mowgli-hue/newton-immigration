import { env } from '../../core/config/env';

export type NotificationEmailPreferences = {
  studyRemindersEnabled: boolean;
  weeklyReportEnabled: boolean;
  onboardingEmailsEnabled: boolean;
  reminderDayOfWeek: number;
  reminderHourLocal: number;
  weeklyReportDayOfWeek: number;
  weeklyReportHourLocal: number;
};

export type NotificationPreferencesResponse = NotificationEmailPreferences & {
  userId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  timezone?: string;
  createdAt: number;
  updatedAt: number;
  lastWelcomeEmailSentAt?: number;
};

function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export async function registerNotificationEmailUser(input: {
  userId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  preferences?: Partial<NotificationEmailPreferences>;
}): Promise<void> {
  const response = await fetch(`${env.apiBaseUrl}/notifications/register-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, timezone: getTimezone() })
  });

  if (!response.ok) {
    throw new Error(`Notification registration failed: ${response.status}`);
  }
}

export async function getNotificationEmailPreferences(userId: string): Promise<NotificationPreferencesResponse | null> {
  const response = await fetch(`${env.apiBaseUrl}/notifications/preferences?userId=${encodeURIComponent(userId)}`);

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load notification preferences: ${response.status}`);
  }

  return (await response.json()) as NotificationPreferencesResponse;
}

export async function updateNotificationEmailPreferences(input: {
  userId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  preferences: Partial<NotificationEmailPreferences>;
}): Promise<NotificationPreferencesResponse> {
  const response = await fetch(`${env.apiBaseUrl}/notifications/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, timezone: getTimezone() })
  });

  if (!response.ok) {
    throw new Error(`Failed to update notification preferences: ${response.status}`);
  }

  const data = (await response.json()) as { preferences: NotificationPreferencesResponse };
  return data.preferences;
}

export async function sendLessonCompletionEmail(input: {
  userId: string;
  email: string;
  displayName?: string;
  lessonId: string;
  lessonTitle: string;
  scorePercent: number;
  nextLessonId?: string;
  minorCorrection?: boolean;
}): Promise<void> {
  const response = await fetch(`${env.apiBaseUrl}/notifications/lesson-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      timezone: getTimezone()
    })
  });

  if (!response.ok) {
    throw new Error(`Lesson completion email failed: ${response.status}`);
  }
}
