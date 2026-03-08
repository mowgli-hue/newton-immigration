import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserLearningProgress } from '../../learning/types';
import { loadCloudLearningProgress, saveCloudLearningProgress } from '../cloud/userStateRepository';

function progressKey(userId: string) {
  return `clb:learning-progress:${userId}`;
}

export async function loadLearningProgress(userId: string): Promise<UserLearningProgress | null> {
  const cloud = await loadCloudLearningProgress<UserLearningProgress>(userId);
  if (cloud) {
    await AsyncStorage.setItem(progressKey(userId), JSON.stringify(cloud));
    return cloud;
  }

  const raw = await AsyncStorage.getItem(progressKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserLearningProgress;
  } catch {
    return null;
  }
}

export async function saveLearningProgress(progress: UserLearningProgress): Promise<void> {
  await AsyncStorage.setItem(progressKey(progress.userId), JSON.stringify(progress));
  try {
    await saveCloudLearningProgress(progress.userId, progress);
  } catch {
    // local persistence remains primary fallback when cloud write fails
  }
}

// Firestore integration placeholder:
// export async function syncLearningProgressToCloud(progress: UserLearningProgress): Promise<void> {
//   // TODO: persist progress document once Firestore module is enabled.
// }
