import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadCloudProfileState, saveCloudReflexPerformanceProfile } from '../cloud/userStateRepository';
import type { ReflexPerformanceProfile, ReflexSessionMetrics } from '../../types/ReflexPerformanceTypes';

const STORAGE_KEY = 'clb:reflex-profile:v1';

const DEFAULT_PROFILE: ReflexPerformanceProfile = {
  reflexAccuracy: 0,
  reflexSpeed: 0,
  weakVocabularyAreas: [],
  sessionsPlayed: 0,
  longestStreak: 0,
  updatedAt: Date.now()
};

function storageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

function normalizeProfile(value: unknown): ReflexPerformanceProfile {
  const raw = (value ?? {}) as Partial<ReflexPerformanceProfile>;
  return {
    reflexAccuracy: Number.isFinite(raw.reflexAccuracy) ? Math.max(0, Math.min(100, Number(raw.reflexAccuracy))) : 0,
    reflexSpeed: Number.isFinite(raw.reflexSpeed) ? Math.max(0, Number(raw.reflexSpeed)) : 0,
    weakVocabularyAreas: Array.isArray(raw.weakVocabularyAreas) ? raw.weakVocabularyAreas.slice(0, 8) : [],
    sessionsPlayed: Number.isFinite(raw.sessionsPlayed) ? Math.max(0, Number(raw.sessionsPlayed)) : 0,
    longestStreak: Number.isFinite(raw.longestStreak) ? Math.max(0, Number(raw.longestStreak)) : 0,
    updatedAt: Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : Date.now()
  };
}

export async function loadReflexPerformanceProfile(userId: string): Promise<ReflexPerformanceProfile> {
  const cloud = await loadCloudProfileState(userId);
  const cloudValue = cloud?.reflexPerformanceProfile as unknown;
  if (cloudValue) {
    const normalized = normalizeProfile(cloudValue);
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(normalized));
    return normalized;
  }

  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_PROFILE;

  try {
    return normalizeProfile(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveReflexPerformanceProfile(userId: string, profile: ReflexPerformanceProfile): Promise<void> {
  const normalized = normalizeProfile(profile);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(normalized));
  try {
    await saveCloudReflexPerformanceProfile(userId, normalized);
  } catch {
    // local persistence remains fallback when cloud write fails
  }
}

export async function updateReflexPerformanceProfile(
  userId: string,
  metrics: ReflexSessionMetrics
): Promise<ReflexPerformanceProfile> {
  const current = await loadReflexPerformanceProfile(userId);
  const sessions = current.sessionsPlayed + 1;

  const weightedAccuracy =
    sessions === 1
      ? metrics.accuracyPercent
      : Math.round((current.reflexAccuracy * current.sessionsPlayed + metrics.accuracyPercent) / sessions);

  const weightedSpeed =
    sessions === 1
      ? metrics.averageReactionMs
      : Math.round((current.reflexSpeed * current.sessionsPlayed + metrics.averageReactionMs) / sessions);

  const nextWeakAreaOrder = Object.entries(metrics.weakAreaCounts)
    .sort((a, b) => Number(b[1] ?? 0) - Number(a[1] ?? 0))
    .map(([area]) => area)
    .slice(0, 3);

  const mergedWeakAreas = Array.from(new Set([...nextWeakAreaOrder, ...current.weakVocabularyAreas])).slice(0, 5);

  const next: ReflexPerformanceProfile = {
    reflexAccuracy: weightedAccuracy,
    reflexSpeed: weightedSpeed,
    weakVocabularyAreas: mergedWeakAreas as ReflexPerformanceProfile['weakVocabularyAreas'],
    sessionsPlayed: sessions,
    longestStreak: Math.max(current.longestStreak, metrics.longestStreak),
    updatedAt: Date.now()
  };

  await saveReflexPerformanceProfile(userId, next);
  return next;
}
