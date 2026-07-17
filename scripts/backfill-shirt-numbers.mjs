// Field-only Firestore backfill for the 32 submitted soccer shirt numbers.
//
// Dry run (default): npm run backfill:shirt-numbers
// Apply atomically:   npm run backfill:shirt-numbers -- --apply
// Roll back field:    npm run backfill:shirt-numbers -- --remove

import { execFileSync } from 'node:child_process'
import { players } from '../src/data/seed.js'

const PROJECT_ID = 'stadio-sports-day-2026'
const EVENT_ID = 'national-sports-day-2026'
const DATABASE = '(default)'
const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--remove') ? 'remove' : 'dry-run'

if (process.argv.includes('--apply') && process.argv.includes('--remove')) {
  throw new Error('Choose either --apply or --remove, not both.')
}

const submitted = Object.entries(players).flatMap(([teamId, roster]) =>
  roster
    .filter((player) => player.sport === 'soccer' && player.role === 'player')
    .map((player) => ({ teamId, ...player })),
)

if (submitted.length !== 32) {
  throw new Error(`Expected 32 submitted soccer players; found ${submitted.length}.`)
}

const documentName = ({ teamId, id }) =>
  `projects/${PROJECT_ID}/databases/${DATABASE}/documents/events/${EVENT_ID}/teams/${teamId}/players/${id}`
const documentUrl = (player) => `https://firestore.googleapis.com/v1/${documentName(player)}`
const fieldString = (field) => field?.stringValue || ''
const fieldNumber = (field) => field?.integerValue == null ? null : Number(field.integerValue)

const live = await Promise.all(submitted.map(async (player) => {
  const response = await fetch(documentUrl(player))
  if (!response.ok) throw new Error(`Player document missing or unreadable: ${player.teamId}/${player.id} (${response.status})`)
  const document = await response.json()
  const firstName = fieldString(document.fields?.firstName)
  const surname = fieldString(document.fields?.surname)
  if (firstName !== player.firstName || surname !== player.surname) {
    throw new Error(`Identity mismatch for ${player.teamId}/${player.id}; refusing all writes.`)
  }
  return { ...player, currentShirtNumber: fieldNumber(document.fields?.shirtNumber) }
}))

const missing = live.filter((player) => player.currentShirtNumber == null).length
const correct = live.filter((player) => player.currentShirtNumber === player.shirtNumber).length
const different = live.filter((player) => player.currentShirtNumber != null && player.currentShirtNumber !== player.shirtNumber).length

console.log(`Preflight OK: ${live.length} identities matched (${missing} missing, ${correct} correct, ${different} different).`)

if (mode === 'dry-run') {
  console.log('Dry run only. Use --apply for the atomic field-only backfill.')
  process.exit(0)
}

const gcloud = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud'
const accessToken = execFileSync(gcloud, ['auth', 'print-access-token'], {
  encoding: 'utf8',
  windowsHide: true,
}).trim()
if (!accessToken) throw new Error('gcloud returned no access token.')

const writes = live.map((player) => ({
  update: {
    name: documentName(player),
    fields: mode === 'apply'
      ? { shirtNumber: { integerValue: String(player.shirtNumber) } }
      : {},
  },
  updateMask: { fieldPaths: ['shirtNumber'] },
  currentDocument: { exists: true },
}))

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

const expected = mode === 'apply' ? 32 : 0
const verified = await Promise.all(live.map(async (player) => {
  const response = await fetch(documentUrl(player), { cache: 'no-store' })
  if (!response.ok) return false
  const document = await response.json()
  const value = fieldNumber(document.fields?.shirtNumber)
  return mode === 'apply' ? value === player.shirtNumber : value == null
}))

const verifiedCount = verified.filter(Boolean).length
if (verifiedCount !== 32) {
  throw new Error(`Commit returned success, but only ${verifiedCount}/32 documents verified. Expected ${expected} populated fields.`)
}

console.log(mode === 'apply'
  ? 'Applied and verified 32/32 shirt-number fields.'
  : 'Removed and verified 32/32 shirt-number fields.')
