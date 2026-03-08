import { cert, getApps, initializeApp } from 'firebase-admin/app';

import { config } from '../../config/env';

export function ensureFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey
    })
  });
}
