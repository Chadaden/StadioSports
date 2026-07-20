# STADIO National Sports Day — Live Event Hub

A mobile-first PWA for STADIO's National Sports Day at Centurion Campus: live
scores, standings, squad travel tracking, day schedule, and (later) a one-tap
MANCO report. Four campuses — Centurion (host), Waterfall, Musgrave, Durbanville
— compete in 5-a-side indoor soccer and netball.

Built to the project's `BUILD SPEC`. Section references below (§) point at it.

> **Canonical hand-off:** read [`CURRENT_STATE.md`](CURRENT_STATE.md) before
> changing or deploying the app. It records the consolidated UI, live-data
> mode, manager isolation, temporary security compromise and safe flash flow.

## Current status

| Phase | Scope | Status |
|------|-------|--------|
| **0** | Scaffold, STADIO design system (§4), Firestore schema (§7), PWA shell, seed data | ✅ Done |
| **1** | **Viewer** (public, read-only): Live · Fixtures · Table · Travel · Schedule | ✅ Done |
| **2** | **Scorekeeper**: live score steppers, scorers, cards, publish/reopen, announcements | ✅ Done |
| **3** | **Team Manager**: Team tab (own roster as player cards) · per-player attendance toggle, "mark all present", milestone-advance | ✅ Done |
| **4** | **MANCO report**: one-tap assembly from Firestore + PDF export | ✅ Done |
| **5** | Live Firestore, role links, QR and deploy workflow | ✅ Done |

## Demo mode vs live mode

The app uses **live Firestore in the deployed build**. The data layer
(`src/store/DataProvider.jsx`) serves the bundled seed snapshot
(`src/data/seed.js`) so the Viewer is fully testable immediately.

When all `VITE_FIREBASE_*` vars are present (see `.env.example`), it switches to
**live Firestore** with real-time listeners and offline persistence — no code
change, same UI.

```bash
npm install
npm run dev        # demo mode — open the printed URL
```

The existing Firebase project is `stadio-sports-day-2026`; reuse its checked-in
configuration and the local git-ignored `.env.local`. Do not create or reseed a
replacement project. See `DEPLOY.md` for the exact preflight and deploy command.

## Three roles, three links (§3)

Resolved in `src/lib/roles.js`:

| Role | Link | Can |
|------|------|-----|
| **Viewer** | `/` (public, QR) | See everything, read-only |
| **Team Manager** | `/?role=manager&team=…` | Mark own squad present · advance own travel milestone |
| **Scorekeeper** | `/?role=scorekeeper` | Edit scores/scorers/cards · post announcements · generate report |

The UI scopes managers to their own team, but the current link-gated test has no
Firebase Auth. Database rules are temporarily open so live testing works; see
the critical warning in `CURRENT_STATE.md`.

## Data & POPIA (§9)

Public player fields and private medical/emergency/dietary profiles are stored
separately in Firestore. The manager UI loads private profiles only for its own
campus, but the temporary test rules do not enforce that separation against
direct database access.

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
  screens/              Live, Team, Fixtures, Table, Travel, Schedule
firestore.rules         security rules (§7)
scripts/seed-firestore.mjs   re-runnable Firestore seeder
```

## Outstanding inputs

Use a live-data audit before requesting missing shirt numbers or profiles; do
not rely on this older README for roster completeness.
