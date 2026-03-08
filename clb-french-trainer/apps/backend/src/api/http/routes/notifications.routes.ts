import { Router } from 'express';
import { z } from 'zod';

import { sendEmail } from '../../../modules/notifications/emailDelivery.service';
import { buildSubject } from '../../../modules/notifications/emailSubject.service';
import { runNotificationSchedulerTick } from '../../../modules/notifications/notificationScheduler';
import {
  getNotificationPreferences,
  listNotificationPreferences,
  markStudyReminderSent,
  markWeeklyReportSent,
  markWelcomeEmailSent,
  upsertNotificationPreferences
} from '../../../modules/notifications/notificationPreferences.store';

export const notificationsRouter = Router();

const prefsQuerySchema = z.object({ userId: z.string().min(1) });

const registerEventSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  emailVerified: z.boolean().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      studyRemindersEnabled: z.boolean().optional(),
      weeklyReportEnabled: z.boolean().optional(),
      onboardingEmailsEnabled: z.boolean().optional(),
      reminderDayOfWeek: z.number().int().min(0).max(6).optional(),
      reminderHourLocal: z.number().int().min(0).max(23).optional(),
      weeklyReportDayOfWeek: z.number().int().min(0).max(6).optional(),
      weeklyReportHourLocal: z.number().int().min(0).max(23).optional()
    })
    .optional()
});

const updatePrefsSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  emailVerified: z.boolean().optional(),
  timezone: z.string().optional(),
  preferences: z.object({
    studyRemindersEnabled: z.boolean().optional(),
    weeklyReportEnabled: z.boolean().optional(),
    onboardingEmailsEnabled: z.boolean().optional(),
    reminderDayOfWeek: z.number().int().min(0).max(6).optional(),
    reminderHourLocal: z.number().int().min(0).max(23).optional(),
    weeklyReportDayOfWeek: z.number().int().min(0).max(6).optional(),
    weeklyReportHourLocal: z.number().int().min(0).max(23).optional()
  })
});

const lessonCompleteSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  lessonId: z.string().min(1),
  lessonTitle: z.string().min(1),
  scorePercent: z.number().min(0).max(100),
  nextLessonId: z.string().optional(),
  minorCorrection: z.boolean().optional()
});

async function buildWelcomeEmail(userId: string, name?: string) {
  const learnerName = name?.trim() || 'there';
  return {
    subject: await buildSubject({ campaign: 'welcome', userId, displayName: name }),
    text: [
      `Hi ${learnerName},`,
      '',
      'Welcome to CLB French Trainer.',
      'Your plan uses focused 25:5 sessions to help you build consistent French progress for TEF Canada and CLB goals.',
      '',
      'What to do first:',
      '1. Complete your onboarding and level placement.',
      '2. Start your first guided lesson.',
      '3. Study regularly using short daily sessions.',
      '',
      'You will receive study reminders and weekly progress summaries (if enabled in your profile).',
      '',
      'CLB French Trainer'
    ].join('\n')
  };
}

notificationsRouter.get('/preferences', async (req, res) => {
  try {
    const { userId } = prefsQuerySchema.parse(req.query ?? {});
    const prefs = await getNotificationPreferences(userId);
    if (!prefs) {
      return res.status(404).json({ message: 'Preferences not found' });
    }
    return res.json(prefs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(400).json({ message });
  }
});

notificationsRouter.post('/register-event', async (req, res) => {
  try {
    const input = registerEventSchema.parse(req.body ?? {});
    const prefs = await upsertNotificationPreferences({
      userId: input.userId,
      email: input.email,
      displayName: input.displayName,
      emailVerified: input.emailVerified,
      timezone: input.timezone,
      patch: input.preferences
    });

    let welcomeEmailSent = false;
    if (prefs.onboardingEmailsEnabled && !prefs.lastWelcomeEmailSentAt) {
      const email = await buildWelcomeEmail(prefs.userId, prefs.displayName);
      await sendEmail({ to: prefs.email, subject: email.subject, text: email.text });
      await markWelcomeEmailSent(prefs.userId);
      welcomeEmailSent = true;
    }

    return res.json({ ok: true, preferences: prefs, welcomeEmailSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(400).json({ message });
  }
});

notificationsRouter.put('/preferences', async (req, res) => {
  try {
    const input = updatePrefsSchema.parse(req.body ?? {});
    const prefs = await upsertNotificationPreferences({
      userId: input.userId,
      email: input.email,
      displayName: input.displayName,
      emailVerified: input.emailVerified,
      timezone: input.timezone,
      patch: input.preferences
    });

    return res.json({ ok: true, preferences: prefs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(400).json({ message });
  }
});

notificationsRouter.post('/jobs/send-study-reminders', async (_req, res) => {
  try {
    const all = await listNotificationPreferences();
    const targets = all.filter((p) => p.studyRemindersEnabled);

    for (const p of targets) {
      const daySeed = new Date().toISOString().slice(0, 10);
      await sendEmail({
        to: p.email,
        subject: await buildSubject({
          campaign: 'studyReminder',
          userId: p.userId,
          daySeed,
          displayName: p.displayName
        }),
        text: [
          `Hi ${p.displayName?.trim() || 'there'},`,
          '',
          'This is your CLB French Trainer study reminder.',
          'Open the app and complete one 25-minute session today.',
          '',
          'Focus on your weakest skill and keep the streak going.'
        ].join('\n')
      });
      await markStudyReminderSent(p.userId, daySeed);
    }

    return res.json({ ok: true, sent: targets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

notificationsRouter.post('/jobs/send-weekly-reports', async (_req, res) => {
  try {
    const all = await listNotificationPreferences();
    const targets = all.filter((p) => p.weeklyReportEnabled);

    for (const p of targets) {
      const daySeed = new Date().toISOString().slice(0, 10);
      await sendEmail({
        to: p.email,
        subject: await buildSubject({
          campaign: 'weeklyReport',
          userId: p.userId,
          daySeed,
          displayName: p.displayName
        }),
        text: [
          `Hi ${p.displayName?.trim() || 'there'},`,
          '',
          'This is your weekly progress reminder from CLB French Trainer.',
          'Open the app to review:',
          '- Completed lessons',
          '- Weak-skill focus',
          '- Next session recommendations',
          '',
          'Keep your 25:5 study routine consistent this week.'
        ].join('\n')
      });
      await markWeeklyReportSent(p.userId, daySeed);
    }

    return res.json({ ok: true, sent: targets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

notificationsRouter.post('/jobs/run-scheduler-tick', async (_req, res) => {
  try {
    const result = await runNotificationSchedulerTick();
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

notificationsRouter.post('/lesson-complete', async (req, res) => {
  try {
    const input = lessonCompleteSchema.parse(req.body ?? {});
    const learnerName = input.displayName?.trim() || 'there';
    const score = Math.round(input.scorePercent);
    const nextLine = input.nextLessonId
      ? `Next recommended lesson: ${input.nextLessonId.replace(/-/g, ' ')}.`
      : 'You completed the current module checkpoint.';
    const correctionLine = input.minorCorrection
      ? 'Great work. You passed with one minor correction, keep refining accuracy.'
      : 'Great work. Your progress is moving in the right direction.';

    await sendEmail({
      to: input.email,
      subject: await buildSubject({
        campaign: 'weeklyReport',
        userId: input.userId,
        daySeed: new Date().toISOString().slice(0, 10),
        displayName: input.displayName
      }),
      text: [
        `Hi ${learnerName},`,
        '',
        `Congratulations on completing ${input.lessonTitle}.`,
        `Score: ${score}%`,
        correctionLine,
        nextLine,
        '',
        'Open Franco and continue your learning path.',
        '',
        'Franco Team'
      ].join('\n')
    });

    return res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(400).json({ message });
  }
});
