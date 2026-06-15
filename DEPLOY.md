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

This seeds: event config, 4 teams, Durbanville roster (21 players),
8 fixtures, travel state, and the opening announcement.
Safe to re-run — it overwrites, not duplicates.

## The three role links

After deploy, the three access links are:

| Role | URL |
|---|---|
| **Viewer** (public, QR) | `https://stadio-sports-day-2026.web.app/` |
| **Scorekeeper** (tablet) | `https://stadio-sports-day-2026.web.app/?role=scorekeeper` |
| **Team Manager** | `https://stadio-sports-day-2026.web.app/?role=manager&team=durbanville` |

Replace `durbanville` with `centurion`, `musgrave`, or `waterfall` for
the other three manager links.

## What the Firestore rules deploy does

The current live rules are `allow write: if true` (open). Deploying
`firestore.rules` from this branch closes that to:
- Public read: everyone
- Write fixtures/announcements/reports: scorekeeper claim only
- Write travel + attendance: team manager claim for own team only

This should be deployed at the earliest opportunity.
