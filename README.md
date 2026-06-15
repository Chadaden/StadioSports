# STADIO National Sports Day — Live Event Hub

A mobile-first PWA for STADIO's National Sports Day at Centurion Campus: live
scores, standings, squad travel tracking, day schedule, and (later) a one-tap
MANCO report. Four campuses — Centurion (host), Waterfall, Musgrave, Durbanville
— compete in 5-a-side indoor soccer and netball.

Built to the project's `BUILD SPEC`. Section references below (§) point at it.

## Current status — Phases 0 + 1 complete

| Phase | Scope | Status |
|------|-------|--------|
| **0** | Scaffold, STADIO design system (§4), Firestore schema (§7), PWA shell, seed data | ✅ Done |
| **1** | **Viewer** (public, read-only): Live · Fixtures · Table · Travel · Schedule + Squads | ✅ Done |
| **2** | **Scorekeeper**: live score steppers, scorers, cards, publish/reopen, announcements | ✅ Done |
| **3** | **Team Manager**: per-player attendance toggle, "mark all present", milestone-advance | ✅ Done |
| **4** | **MANCO report**: one-tap assembly from Firestore + PDF export | ✅ Done |
| 5 | Offline persistence polish, QR + 3 role links, deploy | ⏳ Next |

## Demo mode vs live mode

The app runs with **no backend by default**. The data layer
(`src/store/DataProvider.jsx`) serves the bundled seed snapshot
(`src/data/seed.js`) so the Viewer is fully testable immediately.

When all `VITE_FIREBASE_*` vars are present (see `.env.example`), it switches to
**live Firestore** with real-time listeners and offline persistence — no code
change, same UI.

```bash
npm install
npm run dev        # demo mode — open the printed URL
```

### Going live (full deploy)
1. Create a Firebase project (Firestore + Auth + Hosting).
2. `cp .env.example .env.local` — fill in the `VITE_FIREBASE_*` config values.
3. Update `.firebaserc` with your Firebase project ID.
4. `node scripts/seed-firestore.mjs` to seed the event and Durbanville roster.
5. `npm run build` then `firebase deploy` — deploys hosting + Firestore rules.

## Three roles, three links (§3)

Resolved in `src/lib/roles.js`:

| Role | Link | Can |
|------|------|-----|
| **Viewer** | `/` (public, QR) | See everything, read-only |
| **Team Manager** | `/?role=manager&team=…` | Mark own squad present · advance own travel milestone |
| **Scorekeeper** | `/?role=scorekeeper` | Edit scores/scorers/cards · post announcements · generate report |

Write scopes are isolated in `firestore.rules` — a manager can never edit
scores; the Viewer never needs login.

## Data & POPIA (§9)

Seed data is derived from `Stadio_Sports_day_data.xlsx`. **Only Durbanville has a
real roster (21 people)**; the other three campuses scaffold a clean "Roster
pending" state until their players arrive. Players store **names, sport and role
only** — all PII (ID numbers, cells, emails, DOB, medical, emergency contacts)
is dropped at ingest. Any future PII would live in a restricted `/private`
subcollection, organiser-read only.

## Stack

React 19 · Vite · Firebase / Cloud Firestore · vite-plugin-pwa · jsPDF (report).

## Project layout

```
src/
  data/seed.js          seed snapshot (event, teams, Durbanville roster, fixtures, travel, schedule)
  firebase/config.js    Firebase init — graceful demo fallback + offline persistence
  store/DataProvider.jsx live-or-demo data context
  lib/                  standings, role resolution, constants
  components/           AppHeader, BottomTabBar, shared UI
  screens/              Live, Fixtures, Table, Travel, Schedule, Squads
firestore.rules         security rules (§7)
scripts/seed-firestore.mjs   re-runnable Firestore seeder
```

## Outstanding from the client (§11)

Event date · stream URL(s) · points & tie-breaker confirmation · jersey colour
sign-off · jersey numbers · remaining three rosters · overall "Champion Campus"
question. None block the Viewer.
