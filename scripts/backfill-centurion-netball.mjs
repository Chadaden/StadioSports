// Field-only Firestore backfill for the Centurion netball public roster.
//
// Dry run:          npm run backfill:centurion-netball
// Apply atomically: npm run backfill:centurion-netball -- --apply
//
// This intentionally does not call seed-firestore.mjs because the demo/live
// event may already have match scores. It only upserts Centurion's netball
// player docs and refreshes public roster summary fields.

import { execFileSync } from 'node:child_process'
import { players } from '../src/data/seed.js'

const PROJECT_ID = 'stadio-sports-day-2026'
const EVENT_ID = 'national-sports-day-2026'
const DATABASE = '(default)'
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run'

const centurionPlayers = players.centurion || []
const netballPlayers = centurionPlayers.filter((player) => player.sport === 'netball' && player.role === 'player')

if (netballPlayers.length !== 9) {
  throw new Error(`Expected 9 Centurion netball players; found ${netballPlayers.length}.`)
}

const documentName = (...segments) =>
  `projects/${PROJECT_ID}/databases/${DATABASE}/documents/${segments.join('/')}`
const documentUrl = (...segments) => `https://firestore.googleapis.com/v1/${documentName(...segments)}`
const fieldString = (field) => field?.stringValue || ''

const existing = await Promise.all(netballPlayers.map(async (player) => {
  const response = await fetch(documentUrl('events', EVENT_ID, 'teams', 'centurion', 'players', player.id), { cache: 'no-store' })
  if (response.status === 404) return { ...player, exists: false }
  if (!response.ok) throw new Error(`Unable to read centurion/${player.id} (${response.status}).`)
  const document = await response.json()
  const firstName = fieldString(document.fields?.firstName)
  const surname = fieldString(document.fields?.surname)
  if ((firstName && firstName !== player.firstName) || (surname && surname !== player.surname)) {
    throw new Error(`Identity mismatch for centurion/${player.id}; refusing all writes.`)
  }
  return { ...player, exists: true }
}))

const missing = existing.filter((player) => !player.exists).length
console.log(`Preflight OK: ${netballPlayers.length} Centurion netball players (${missing} new, ${netballPlayers.length - missing} existing).`)

if (mode === 'dry-run') {
  console.log('Dry run only. Use --apply for the atomic Firestore backfill.')
  process.exit(0)
}

const authCommand = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'gcloud'
const authArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'gcloud auth print-access-token']
  : ['auth', 'print-access-token']
const accessToken = execFileSync(authCommand, authArgs, {
  encoding: 'utf8',
  windowsHide: true,
}).trim()
if (!accessToken) throw new Error('gcloud returned no access token.')

const playerWrites = netballPlayers.map((player) => {
  const { id, ...docFields } = player
  return {
    update: {
      name: documentName('events', EVENT_ID, 'teams', 'centurion', 'players', id),
      fields: toFirestoreFields({ ...docFields, present: false }),
    },
  }
})

const writes = [
  ...playerWrites,
  {
    update: {
      name: documentName('events', EVENT_ID, 'teams', 'centurion'),
      fields: toFirestoreFields({ rosterLoaded: true }),
    },
    updateMask: { fieldPaths: ['rosterLoaded'] },
    currentDocument: { exists: true },
  },
  {
    update: {
      name: documentName('events', EVENT_ID, 'travel', 'centurion'),
      fields: {
        attendance: {
          mapValue: {
            fields: {
              total: { integerValue: String(centurionPlayers.length) },
            },
          },
        },
      },
    },
    updateMask: { fieldPaths: ['attendance.total'] },
    currentDocument: { exists: true },
  },
]

const commitResponse = await fetch(
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents:commit`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  },
)

if (!commitResponse.ok) {
  const detail = await commitResponse.text()
  throw new Error(`Atomic Firestore commit failed (${commitResponse.status}): ${detail.slice(0, 500)}`)
}

const verified = await Promise.all(netballPlayers.map(async (player) => {
  const response = await fetch(documentUrl('events', EVENT_ID, 'teams', 'centurion', 'players', player.id), { cache: 'no-store' })
  if (!response.ok) return false
  const document = await response.json()
  return fieldString(document.fields?.firstName) === player.firstName
    && fieldString(document.fields?.surname) === player.surname
    && fieldString(document.fields?.sport) === 'netball'
}))

const verifiedCount = verified.filter(Boolean).length
if (verifiedCount !== netballPlayers.length) {
  throw new Error(`Commit returned success, but only ${verifiedCount}/${netballPlayers.length} player docs verified.`)
}

console.log(`Applied and verified ${verifiedCount}/${netballPlayers.length} Centurion netball player docs.`)

function toFirestoreFields(value) {
  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [key, toFirestoreValue(raw)]),
  )
}

function toFirestoreValue(value) {
  if (value == null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value }
  return { stringValue: String(value) }
}
