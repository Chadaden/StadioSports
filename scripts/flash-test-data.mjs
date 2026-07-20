// "Flash" — wipe match-day test data back to a pristine pre-game state,
// WITHOUT touching rosters or private profiles (those don't need re-entry
// between test rounds, or right before the real event).
//
// Resets: fixture scores/clocks/scorers/cards → upcoming/0-0, every player's
// `present` flag → false, travel/attendance → the seed baseline, and
// announcements → just the original welcome message (deletes any test ones
// added along the way). Does NOT touch team/player roster fields or the
// `private` (medical/emergency/dietary) subcollection — that data is real
// and should survive a flash.
//
// Dry-run by default — prints what it would reset. Pass --confirm to
// actually write.
//
// Usage:
//   node scripts/flash-test-data.mjs            (dry run)
//   node scripts/flash-test-data.mjs --confirm   (actually resets)

import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore, doc, collection, getDocs, writeBatch,
} from 'firebase/firestore'
import {
  EVENT_ID, event, teams, players, fixtures, travel, announcements,
} from '../src/data/seed.js'

const CONFIRM = process.argv.includes('--confirm')

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

const allPlayers = Object.entries(players).flatMap(
  ([teamId, list]) => list.map((p) => ({ ...p, teamId })),
)
const existingAnnouncements = await getDocs(collection(db, ...base, 'announcements'))

console.log(`Flash target: events/${eventId}`)
console.log(`  ${fixtures.length} fixtures → upcoming, 0-0, clocks/scorers/cards cleared`)
console.log(`  ${allPlayers.length} players → present: false`)
console.log(`  ${Object.keys(travel).length} travel docs → reset to seed baseline`)
console.log(`  ${existingAnnouncements.size} existing announcement doc(s) → replaced with the original ${announcements.length}`)
console.log(`  event.status → "${event.status}"`)
console.log('  NOT touched: team/player roster fields, private (medical/emergency/dietary) profiles')

if (!CONFIRM) {
  console.log('\nDry run only — nothing written. Re-run with --confirm to apply.')
  process.exit(0)
}

const batch = writeBatch(db)

batch.set(doc(db, ...base), event, { merge: true })

for (const f of fixtures) {
  const { id, ...fDoc } = f
  batch.set(doc(db, ...base, 'fixtures', id), fDoc)
}

for (const p of allPlayers) {
  batch.update(doc(db, ...base, 'teams', p.teamId, 'players', p.id), { present: false })
}

for (const [teamId, t] of Object.entries(travel)) {
  batch.set(doc(db, ...base, 'travel', teamId), t)
}

for (const existing of existingAnnouncements.docs) {
  batch.delete(existing.ref)
}
for (const a of announcements) {
  const { id, ...aDoc } = a
  batch.set(doc(db, ...base, 'announcements', id), aDoc)
}

await batch.commit()
console.log('\n✓ Flashed — match-day data reset to pristine, rosters and private profiles untouched.')
process.exit(0)
