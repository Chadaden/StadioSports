# STADIO National Sports Day — Live Event Hub

A mobile-first PWA for STADIO's National Sports Day at Centurion Campus: live
scores, standings, squad travel tracking, and a one-tap MANCO report. Four
campuses (Centurion · Waterfall · Musgrave · Durbanville) compete in 5-a-side
indoor soccer and netball across a round-robin, a 3rd/4th playoff, and a final
per sport.

Built per the build specification (`stadiosportsdayBUILDSPEC.html`). STADIO
brand-locked: light theme, charcoal text, the nine-colour STADIO spectrum used
sparingly as accents.

## Stack

- **React 18 + Vite** — mobile-first, installable PWA (manifest + service worker)
- **Firebase / Cloud Firestore** — real-time listeners drive live scores & travel
- **Firebase Auth (anonymous)** — public viewer needs no login
- **jsPDF** — client-side MANCO report export
- Offline persistence enabled (`persistentLocalCache`) for patchy venue wifi

## Three roles, three links

| Role | Link | Access |
|------|------|--------|
| **Viewer** | `/` | Public. Read-only. Zero trace of organiser tools. |
| **Scorekeeper** | `/?role=scorekeeper` | PIN-gated. Live scoring, scorers, cards, publish, announcements, MANCO report. |
| **Team Manager** | `/?role=manager&team=<teamId>` | PIN-gated per team. Attendance register + travel milestones for own team only. |

`teamId` is one of `centurion`, `waterfall`, `musgrave`, `durbanville`.

PINs are read from `events/nsd2026.pins` in Firestore. Before Firebase is wired
up, dev fallback PINs apply: scorekeeper `1234`, managers `0000`.

## Getting started

```bash
npm install
cp .env.example .env      # fill in your Firebase web config
npm run dev
```

The app runs on dev-fallback PINs without Firebase, but live data, scoring and
the report require a Firestore backend.

## Firebase setup

1. Create a Firebase project; enable **Firestore** and **Anonymous Auth**.
2. Copy the web app config into `.env` (see `.env.example`).
3. Deploy security rules: `firebase deploy --only firestore:rules`
4. Seed the event data (see below).
5. Build and deploy hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Seeding data

The seed script loads the event config, four teams, the Durbanville roster (21
people — the only campus with rosters in the source workbook), eight fixtures,
and four travel/attendance docs. Musgrave, Centurion and Waterfall scaffold as
"Roster pending" empty states.

```bash
cd seed
npm install
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json   # Firebase Admin key
export FIREBASE_PROJECT_ID=your-project-id
node seed.js
```

Re-run after adding more rosters — new players appear automatically in Squads,
attendance and scorer pickers with no code change.

## Project structure

```
src/
  firebase.js            Firestore + Auth init, offline persistence
  contexts/RoleContext   URL-param role parsing, PIN gating, sessionStorage
  hooks/                 onSnapshot hooks: event, fixtures, teams, players, travel, announcements
  utils/standings.js     P/W/D/L/GF/GA/GD/Pts with head-to-head tiebreaker
  utils/report.js        MANCO PDF assembly + Firestore snapshot
  components/            SpectrumBar, BottomNav, TeamBadge, PinGate, MatchCard,
                         AnnouncementFeed, StandingsTable, TravelCard
  screens/               Live · Fixtures · Table · Travel · Schedule · Squads
seed/                    firebase-admin seed script
firestore.rules          MVP open read/write scoped to events/{eventId}/**
firebase.json            Firestore rules + Hosting SPA rewrite
```

## Scoring & report

- Scorekeeper taps `+/−` steppers; writes propagate live to all viewers.
- "+ Scorer" / "+ Card" append to the fixture; "Publish" locks the match final.
- Points: soccer win 3 / draw 1 / loss 0; netball win 2 / draw 1 / loss 0.
  Tiebreakers: points → score difference → head-to-head.
- The MANCO report assembles attendance, results, final standings, and named
  scorers/cards from Firestore, exports to PDF, and saves a snapshot to
  `events/nsd2026/reports/{id}`.

## POPIA note

Only **names, sport and role** are ingested. Student ID numbers, contact
details, medical and emergency-contact data from the source workbook are **not**
stored in the app. If organiser-only medical/emergency info is ever needed, it
belongs in a restricted `/private` subcollection — never on the viewer link.
