import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

import {
  auth,
  loginWithEmailPassword,
  logoutCurrentUser,
  reloadUser,
  registerWithEmailPassword,
  sendVerificationEmail
} from '../services/firebase';
import { registerNotificationEmailUser } from '../services/notifications/notificationEmailService';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async login(email, password) {
        const loggedInUser = await loginWithEmailPassword(email, password);
        await reloadUser(loggedInUser);

        if (!loggedInUser.emailVerified) {
          try {
            await sendVerificationEmail(loggedInUser);
          } catch {
            // non-blocking; still enforce verification
          }
          await logoutCurrentUser();
          const err = new Error('Please verify your email before login. We sent a new verification email.');
          (err as Error & { code?: string }).code = 'auth/email-not-verified';
          throw err;
        }
      },
      async register(name, email, password) {
        const createdUser = await registerWithEmailPassword(email, password);
        if (name.trim().length > 0) {
          await updateProfile(createdUser, { displayName: name.trim() });
        }
        try {
          await sendVerificationEmail(createdUser);
        } catch {
          // non-blocking in mobile flow
        }
        try {
          await registerNotificationEmailUser({
            userId: createdUser.uid,
            email: createdUser.email ?? email,
            displayName: name.trim() || undefined,
            emailVerified: createdUser.emailVerified
          });
        } catch {
          // non-blocking while backend may be offline during development
        }
        await logoutCurrentUser();
      },
      async resendVerification(email, password) {
        const sessionUser = await loginWithEmailPassword(email, password);
        await reloadUser(sessionUser);

        if (sessionUser.emailVerified) {
          await logoutCurrentUser();
          const err = new Error('This email is already verified. You can login directly.');
          (err as Error & { code?: string }).code = 'auth/email-already-verified';
          throw err;
        }

        await sendVerificationEmail(sessionUser);
        await logoutCurrentUser();
      },
      async logout() {
        await logoutCurrentUser();
      }
    }),
    [initializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
