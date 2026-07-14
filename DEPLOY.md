# Deploy instructions — STADIO National Sports Day Live Hub

Firebase project: **stadio-sports-day-2026**
Live URL: https://stadio-sports-day-2026.web.app

## What to deploy

1. **Hosting** — the built React app (`dist/`)
2. **Firestore rules** — `firestore.rules` (tightens the current open rules)

## Prerequisites

- Node 18+
- `npm install -g firebase-tools` then `firebase login`
- A `.env.local` file in the repo root with the six Firebase config values (see below)

## Required environment variables

Create `.env.local` (never committed — already in .gitignore):

```
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=stadio-sports-day-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stadio-sports-day-2026
VITE_FIREBASE_STORAGE_BUCKET=stadio-sports-day-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=…
VITE_EVENT_ID=national-sports-day-2026
```

Get the values from:
Firebase console → Project settings → Your apps → SDK setup → Config

## Deploy commands

```bash
# Install dependencies
npm install

# Build the app (requires .env.local with VITE_FIREBASE_* vars)
npm run build

# Deploy hosting + Firestore rules in one shot
firebase deploy

# Or separately:
firebase deploy --only hosting       # just the app
firebase deploy --only firestore:rules  # just security rules (no build needed)
```

## First-time data seed

If the Firestore event data needs to be (re-)seeded:

```bash
node scripts/seed-firestore.mjs
```

This seeds: event config, 4 teams, the Durbanville (21), Musgrave (20) and
Waterfall (17) rosters with their manager-only private profiles (emergency
contacts, medical, dietary), 8 fixtures, travel state, and the opening
announcement. Safe to re-run — it overwrites, not duplicates.

**Re-run this after deploying this branch** — player ids were regenerated
from the updated sheet and fixtures now carry the match-clock field.

**Private profiles need a local file**: this repo is PUBLIC, so the
emergency-contact/medical data is never committed. Place the provided
`privateProfiles.local.js` at `src/data/privateProfiles.local.js`
(git-ignored; shape documented in `src/data/privateProfiles.example.js`)
before seeding or before building a demo-mode bundle. Without it the app
still works — managers just see "No private details on file".

## The three role links

After deploy, the three access links are:

| Role | URL |
|---|---|
| **Viewer** (public, QR) | `https://stadio-sports-day-2026.web.app/` |
| **Scorekeeper** (tablet) | `https://stadio-sports-day-2026.web.app/?role=scorekeeper` |
| **Team Manager** | `https://stadio-sports-day-2026.web.app/?role=manager&team=durbanville` |

Replace `durbanville` with `centurion`, `musgrave`, or `waterfall` for
the other three manager links.

## Spectator QR code

The spectator QR code (it encodes the Viewer URL above) ships in `public/`
and is also hosted after deploy:

- Plain QR: `https://stadio-sports-day-2026.web.app/spectator-qr.png`
- Print-ready A4 poster: `https://stadio-sports-day-2026.web.app/spectator-qr-poster.png`

Spectators scan it with their phone camera — no app, no login.

## What the Firestore rules deploy does

The current live rules are `allow write: if true` (open). Deploying
`firestore.rules` from this branch closes that to:
- Public read: everyone — EXCEPT `teams/{teamId}/private/*` (emergency
  contacts, medical, dietary), which only the owning team's manager or the
  organiser can read
- Write fixtures/announcements/reports: scorekeeper claim only
- Write travel + attendance: team manager claim for own team only

This should be deployed at the earliest opportunity — ideally BEFORE
running the seed script, since the seed now writes the private player
profiles and the open rules would leave them publicly readable.

NOTE: the tightened rules key off Firebase Auth custom claims, which the
link-gated MVP does not issue yet. Until auth ships, live Firestore must
keep the open rules for the app to function (the client test accepted
this §7 shortcut) — which means seeded private profiles are only
link-gated, not access-controlled. If that trade-off isn't acceptable for
the test day, skip seeding profiles (comment out the `private` block in
`scripts/seed-firestore.mjs`) and managers fall back to "No private
details on file".
