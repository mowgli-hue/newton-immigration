import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  type Auth,
  createUserWithEmailAndPassword,
  getAuth,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';

import { env } from '../core/config/env';

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const hasEffectiveFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0
);

if (!hasEffectiveFirebaseConfig) {
  console.error('[firebase] Firebase config is incomplete after env/default resolution.');
} else {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = (() => {
      try {
        // Dynamic bridge for RN persistence keeps compatibility across firebase package variants.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const firebaseAuth = require('firebase/auth') as {
          initializeAuth?: (a: unknown, opts?: unknown) => ReturnType<typeof getAuth>;
          getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
        };
        if (firebaseAuth.initializeAuth && firebaseAuth.getReactNativePersistence) {
          return firebaseAuth.initializeAuth(app, {
            persistence: firebaseAuth.getReactNativePersistence(AsyncStorage)
          });
        }
        return getAuth(app);
      } catch {
        return getAuth(app);
      }
    })();
  } catch (error) {
    console.error('[firebase] Initialization failed', error);
  }
}

export { app, auth };
export { db };

function ensureAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check Firebase config and authorized domains.');
  }
  return auth;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(ensureAuth(), email, password);
  return credential.user;
}

export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(ensureAuth(), email, password);
  return credential.user;
}

export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function reloadUser(user: User): Promise<void> {
  await reload(user);
}

export async function logoutCurrentUser(): Promise<void> {
  await signOut(ensureAuth());
}
