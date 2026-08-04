// Field-only Firestore patch for the 4 teams' colorHex/colorKey — brings the
// already-seeded live event onto the locked STADIO colour system
// (STADIO-sports-hub-colour-system.md §2) without touching rosters, fixtures,
// travel, or player ids. Same atomic REST + gcloud-auth pattern as
// backfill-shirt-numbers.mjs.
//
// Dry run (default): node scripts/patch-team-colors.mjs
// Apply atomically:   node scripts/patch-team-colors.mjs --apply

import { execFileSync } from 'node:child_process'
import { teams } from '../src/data/seed.js'

const PROJECT_ID = 'stadio-sports-day-2026'
const EVENT_ID = 'national-sports-day-2026'
const DATABASE = '(default)'
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run'

if (teams.length !== 4) {
  throw new Error(`Expected 4 teams; found ${teams.length}.`)
}

const documentName = ({ id }) =>
  `projects/${PROJECT_ID}/databases/${DATABASE}/documents/events/${EVENT_ID}/teams/${id}`
const documentUrl = (team) => `https://firestore.googleapis.com/v1/${documentName(team)}`
const fieldString = (field) => field?.stringValue || ''

const live = await Promise.all(teams.map(async (team) => {
  const response = await fetch(documentUrl(team))
  if (!response.ok) throw new Error(`Team document missing or unreadable: ${team.id} (${response.status})`)
  const document = await response.json()
  const name = fieldString(document.fields?.name)
  if (name !== team.name) {
    throw new Error(`Identity mismatch for ${team.id}: live name "${name}" vs expected "${team.name}"; refusing all writes.`)
  }
  return {
    ...team,
    currentColorHex: fieldString(document.fields?.colorHex),
    currentColorKey: fieldString(document.fields?.colorKey),
  }
}))

for (const team of live) {
  const changed = team.currentColorHex !== team.colorHex || team.currentColorKey !== team.colorKey
  console.log(
    `${team.id.padEnd(12)} ${team.currentColorKey || '(none)'} ${team.currentColorHex || '(none)'}`
    + ` -> ${team.colorKey} ${team.colorHex}${changed ? '' : '  (already correct)'}`,
  )
}

if (mode === 'dry-run') {
  console.log('\nDry run only. Use --apply to write these 4 teams\' colorHex/colorKey fields.')
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

const writes = live.map((team) => ({
  update: {
    name: documentName(team),
    fields: {
      colorHex: { stringValue: team.colorHex },
      colorKey: { stringValue: team.colorKey },
    },
  },
  updateMask: { fieldPaths: ['colorHex', 'colorKey'] },
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

const verified = await Promise.all(live.map(async (team) => {
  const response = await fetch(documentUrl(team), { cache: 'no-store' })
  if (!response.ok) return false
  const document = await response.json()
  return fieldString(document.fields?.colorHex) === team.colorHex
    && fieldString(document.fields?.colorKey) === team.colorKey
}))

const verifiedCount = verified.filter(Boolean).length
if (verifiedCount !== 4) {
  throw new Error(`Commit returned success, but only ${verifiedCount}/4 team documents verified.`)
}

console.log('Applied and verified 4/4 teams\' colorHex/colorKey fields.')
