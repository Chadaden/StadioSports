// Firebase initialisation — graceful by design.
//
// If every VITE_FIREBASE_* var is present we boot a real Firebase app with
// Firestore + offline persistence (UX law §5.6 — the venue wifi will drop).
// If any are missing we export `db = null` and the data layer falls back to
// the bundled seed (see store/DataProvider.jsx). This keeps the Viewer fully
// demonstrable with zero backend setup, and flips to live the instant creds
// are supplied.

import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'national-sports-day-2026'

// "Configured" = the four fields we actually need to connect are non-empty.
export const isFirebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId,
)

let app = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(cfg)
  // initializeFirestore (not getFirestore) so we can enable persistent cache.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
}

export { app, db }
