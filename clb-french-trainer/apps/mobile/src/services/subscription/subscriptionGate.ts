import type { UserSubscriptionProfile } from '../../navigation/routePersistence';

export function isProLessonId(lessonId: string): boolean {
  return /^a2-lesson-/.test(lessonId) || /^b1-lesson-/.test(lessonId) || /^(clb5|clb7)-lesson-/.test(lessonId);
}

export function shouldRouteToUpgrade(profile: UserSubscriptionProfile): boolean {
  if (profile.subscriptionStatus === 'active') return false;
  if (!profile.proPreviewUsed) return false;
  return true;
}

export function shouldAllowSinglePreview(profile: UserSubscriptionProfile): boolean {
  if (profile.subscriptionStatus === 'active') return false;
  return profile.proPreviewUsed === false;
}
