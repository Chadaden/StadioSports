// Seed a fresh Firestore event from the bundled seed data (build spec §9).
//
// Usage:
//   1. Create .env.local with your VITE_FIREBASE_* values (see .env.example).
//   2. node scripts/seed-firestore.mjs
//
// Re-runnable: it overwrites the event/teams/players/fixtures/travel docs, so
// when more rosters arrive you update src/data/seed.js and re-run this (§9
// "adding the remaining teams later"). New players appear in Squads, the
// attendance register and scorer pickers with no code change.

import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, writeBatch } from 'firebase/firestore'
import {
  EVENT_ID, event, teams, players, fixtures, travel, announcements,
} from '../src/data/seed.js'

// Minimal .env.local loader (avoids adding a dotenv dependency).
function loadEnv() {
  try {
    const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    console.error('No .env.local found — copy .env.example and fill in your Firebase config.')
    process.exit(1)
  }
}

loadEnv()

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}
if (!cfg.apiKey || !cfg.projectId) {
  console.error('Missing Firebase config in .env.local.')
  process.exit(1)
}

const db = getFirestore(initializeApp(cfg))
const eventId = process.env.VITE_EVENT_ID || EVENT_ID
const base = ['events', eventId]

const batch = writeBatch(db)
batch.set(doc(db, ...base), event)
for (const t of teams) {
  const { ...teamDoc } = t
  batch.set(doc(db, ...base, 'teams', t.id), teamDoc)
  for (const p of players[t.id] || []) {
    const { id, ...pDoc } = p
    batch.set(doc(db, ...base, 'teams', t.id, 'players', id), { ...pDoc, present: false })
  }
}
for (const f of fixtures) {
  const { id, ...fDoc } = f
  batch.set(doc(db, ...base, 'fixtures', id), fDoc)
}
for (const [teamId, t] of Object.entries(travel)) {
  batch.set(doc(db, ...base, 'travel', teamId), t)
}
for (const a of announcements) {
  const { id, ...aDoc } = a
  batch.set(doc(db, ...base, 'announcements', id), aDoc)
}

await batch.commit()
console.log(`✓ Seeded event "${eventId}" — ${teams.length} teams, ` +
  `${Object.values(players).flat().length} players, ${fixtures.length} fixtures.`)
process.exit(0)
