import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../firebase';

const STATE_COLLECTION = 'users';
const STATE_SUBCOLLECTION = 'appState';
const PROFILE_DOC = 'profile';
const LEARNING_PROGRESS_DOC = 'learningProgress';
const CURRICULUM_DOC = 'curriculum';

type CloudProfileState = {
  onboardingProfile?: unknown;
  lastMainRoute?: unknown;
  onboardingCompleted?: boolean;
  subscriptionProfile?: unknown;
  reflexPerformanceProfile?: unknown;
};

function profileRef(userId: string) {
  return db ? doc(db, STATE_COLLECTION, userId, STATE_SUBCOLLECTION, PROFILE_DOC) : null;
}

function learningProgressRef(userId: string) {
  return db ? doc(db, STATE_COLLECTION, userId, STATE_SUBCOLLECTION, LEARNING_PROGRESS_DOC) : null;
}

function curriculumRef(userId: string) {
  return db ? doc(db, STATE_COLLECTION, userId, STATE_SUBCOLLECTION, CURRICULUM_DOC) : null;
}

export async function loadCloudProfileState(userId: string): Promise<CloudProfileState | null> {
  const ref = profileRef(userId);
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as CloudProfileState;
  } catch {
    return null;
  }
}

export async function saveCloudOnboardingProfile(userId: string, onboardingProfile: unknown): Promise<void> {
  const ref = profileRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      onboardingProfile,
      onboardingCompleted: true,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveCloudLastMainRoute(userId: string, lastMainRoute: unknown): Promise<void> {
  const ref = profileRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      lastMainRoute,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveCloudOnboardingCompleted(userId: string, onboardingCompleted: boolean): Promise<void> {
  const ref = profileRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      onboardingCompleted,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveCloudSubscriptionProfile(userId: string, subscriptionProfile: unknown): Promise<void> {
  const ref = profileRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      subscriptionProfile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveCloudReflexPerformanceProfile(userId: string, reflexPerformanceProfile: unknown): Promise<void> {
  const ref = profileRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      reflexPerformanceProfile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function loadCloudLearningProgress<T>(userId: string): Promise<T | null> {
  const ref = learningProgressRef(userId);
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as { value?: T };
    return (data.value as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveCloudLearningProgress<T>(userId: string, value: T): Promise<void> {
  const ref = learningProgressRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      value,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

type CloudCurriculumPayload<TState, TCertificates> = {
  curriculumState: TState;
  earnedCertificates: TCertificates;
};

export async function loadCloudCurriculumState<TState, TCertificates>(
  userId: string
): Promise<CloudCurriculumPayload<TState, TCertificates> | null> {
  const ref = curriculumRef(userId);
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<CloudCurriculumPayload<TState, TCertificates>>;
    if (!data.curriculumState || !data.earnedCertificates) return null;
    return {
      curriculumState: data.curriculumState as TState,
      earnedCertificates: data.earnedCertificates as TCertificates
    };
  } catch {
    return null;
  }
}

export async function saveCloudCurriculumState<TState, TCertificates>(
  userId: string,
  payload: CloudCurriculumPayload<TState, TCertificates>
): Promise<void> {
  const ref = curriculumRef(userId);
  if (!ref) return;
  await setDoc(
    ref,
    {
      curriculumState: payload.curriculumState,
      earnedCertificates: payload.earnedCertificates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
