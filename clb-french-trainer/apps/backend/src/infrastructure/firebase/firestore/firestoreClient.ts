import { getFirestore } from 'firebase-admin/firestore';

import { ensureFirebaseAdmin } from '../admin/firebaseAdmin';

export function getFirestoreClient() {
  ensureFirebaseAdmin();
  return getFirestore();
}
