# Deploy instructions — STADIO National Sports Day Live Hub

Firebase project: **stadio-sports-day-2026**
Live URL: https://stadio-sports-day-2026.web.app

## What to deploy

1. **Hosting** — the built React app (`dist/`)
2. **Firestore rules** — `firestore.rules` (temporary live-test rules; see warning below)

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

# Deploy Hosting only
npx firebase-tools deploy --only hosting --project stadio-sports-day-2026 --non-interactive

# Deploy the separately approved temporary test rules only when requested
npx firebase-tools deploy --only firestore:rules --project stadio-sports-day-2026 --non-interactive
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

The current rules intentionally keep the client-approved live test working
without Firebase Auth. They allow direct public access to live event data and
private player profiles. Manager isolation exists in the UI/data subscriptions,
not at the database boundary. This is a critical temporary compromise; do not
describe these rules as tightened or production-secure.
