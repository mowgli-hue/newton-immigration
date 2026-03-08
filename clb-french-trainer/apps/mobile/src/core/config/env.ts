declare const process: { env: Record<string, string | undefined> };
import Constants from 'expo-constants';

function normalizeApiBaseUrl(raw?: string): string {
  const fallback = 'http://localhost:4000/api';
  const value = (raw ?? '').trim();
  if (!value) return fallback;

  // If a secret or bad suffix was accidentally appended, recover host:port and force /api.
  const hostPortMatch = value.match(/^(https?:\/\/[^/\s:]+(?::\d+)?)/i);
  if (hostPortMatch?.[1]) {
    return `${hostPortMatch[1]}/api`;
  }

  return fallback;
}

function optionalEnv(key: string): string {
  return (process.env[key] ?? '').trim();
}

type FirebasePublicFallback = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const firebasePublicFromExpo =
  ((Constants?.expoConfig?.extra as { firebasePublic?: FirebasePublicFallback } | undefined)?.firebasePublic ??
    {}) as FirebasePublicFallback;

let firebasePublicFromAppJson: FirebasePublicFallback = {};
try {
  // Stable fallback for static web exports where Constants.expoConfig may be unavailable.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appConfig = require('../../../app.json') as {
    expo?: { extra?: { firebasePublic?: FirebasePublicFallback } };
  };
  firebasePublicFromAppJson = appConfig?.expo?.extra?.firebasePublic ?? {};
} catch {
  firebasePublicFromAppJson = {};
}

function envOrExpoFallback(key: string, expoValue?: string): string {
  const value = optionalEnv(key);
  if (value) return value;
  if (expoValue?.trim()) return expoValue.trim();

  const appJsonMap: Record<string, string | undefined> = {
    EXPO_PUBLIC_FIREBASE_API_KEY: firebasePublicFromAppJson.apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: firebasePublicFromAppJson.authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: firebasePublicFromAppJson.projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: firebasePublicFromAppJson.storageBucket,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebasePublicFromAppJson.messagingSenderId,
    EXPO_PUBLIC_FIREBASE_APP_ID: firebasePublicFromAppJson.appId
  };

  return (appJsonMap[key] ?? '').trim();
}

const requiredFirebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
] as const;

export const missingPublicEnvKeys = requiredFirebaseKeys.filter((key) => !optionalEnv(key));
export const hasMissingPublicEnv = missingPublicEnvKeys.length > 0;

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  firebase: {
    apiKey: envOrExpoFallback('EXPO_PUBLIC_FIREBASE_API_KEY', firebasePublicFromExpo.apiKey),
    authDomain: envOrExpoFallback('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebasePublicFromExpo.authDomain),
    projectId: envOrExpoFallback('EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebasePublicFromExpo.projectId),
    storageBucket: envOrExpoFallback('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', firebasePublicFromExpo.storageBucket),
    messagingSenderId: envOrExpoFallback(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      firebasePublicFromExpo.messagingSenderId
    ),
    appId: envOrExpoFallback('EXPO_PUBLIC_FIREBASE_APP_ID', firebasePublicFromExpo.appId)
  }
};
