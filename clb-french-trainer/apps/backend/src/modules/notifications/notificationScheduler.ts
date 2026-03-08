import { sendEmail } from './emailDelivery.service';
import { buildSubject } from './emailSubject.service';
import {
  listNotificationPreferences,
  markStudyReminderSent,
  markWeeklyReportSent,
  type NotificationPreferences
} from './notificationPreferences.store';

type LocalDateParts = {
  dateKey: string;
  weekday: number; // 0=Sunday
  hour: number;
};

function getLocalDateParts(timezone?: string): LocalDateParts {
  const tz = timezone || 'UTC';
  const now = new Date();
  const weekdayText = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(now);
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: tz
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: tz
    }).format(now)
  );

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return { dateKey, weekday: weekdayMap[weekdayText] ?? now.getDay(), hour };
}

function shouldSendStudyReminder(prefs: NotificationPreferences, local: LocalDateParts): boolean {
  if (!prefs.studyRemindersEnabled) return false;
  if (local.weekday !== prefs.reminderDayOfWeek) return false;
  if (local.hour !== prefs.reminderHourLocal) return false;
  return prefs.lastStudyReminderLocalDate !== local.dateKey;
}

function shouldSendWeeklyReport(prefs: NotificationPreferences, local: LocalDateParts): boolean {
  if (!prefs.weeklyReportEnabled) return false;
  if (local.weekday !== prefs.weeklyReportDayOfWeek) return false;
  if (local.hour !== prefs.weeklyReportHourLocal) return false;
  return prefs.lastWeeklyReportLocalDate !== local.dateKey;
}

export async function runNotificationSchedulerTick(): Promise<{ reminders: number; weeklyReports: number }> {
  const all = await listNotificationPreferences();
  let reminders = 0;
  let weeklyReports = 0;

  for (const prefs of all) {
    const local = getLocalDateParts(prefs.timezone);

    if (shouldSendStudyReminder(prefs, local)) {
      await sendEmail({
        to: prefs.email,
        subject: await buildSubject({
          campaign: 'studyReminder',
          userId: prefs.userId,
          daySeed: local.dateKey,
          displayName: prefs.displayName
        }),
        text: [
          `Hi ${prefs.displayName?.trim() || 'there'},`,
          '',
          'Your French focus session is due.',
          'Complete one 25-minute Franco session today to maintain momentum toward your CLB target.',
          '',
          'Open Franco now and continue your current lesson.'
        ].join('\n')
      });
      await markStudyReminderSent(prefs.userId, local.dateKey);
      reminders += 1;
    }

    if (shouldSendWeeklyReport(prefs, local)) {
      await sendEmail({
        to: prefs.email,
        subject: await buildSubject({
          campaign: 'weeklyReport',
          userId: prefs.userId,
          daySeed: local.dateKey,
          displayName: prefs.displayName
        }),
        text: [
          `Hi ${prefs.displayName?.trim() || 'there'},`,
          '',
          'Your weekly Franco report is ready.',
          'This week, review:',
          '- sessions completed',
          '- weakest skill focus',
          '- next module recommendation',
          '',
          'Keep the 25:5 rhythm next week for measurable progress.'
        ].join('\n')
      });
      await markWeeklyReportSent(prefs.userId, local.dateKey);
      weeklyReports += 1;
    }
  }

  return { reminders, weeklyReports };
}

export function startNotificationScheduler(intervalMs: number): NodeJS.Timeout {
  const safeInterval = Math.max(60000, intervalMs);
  const timer = setInterval(() => {
    void runNotificationSchedulerTick()
      .then((result) => {
        if (result.reminders > 0 || result.weeklyReports > 0) {
          console.log('[notifications:scheduler]', JSON.stringify(result));
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown scheduler error';
        console.error('[notifications:scheduler] tick failed', message);
      });
  }, safeInterval);

  return timer;
}
