# STADIO Sports Day — canonical current state

This file is the hand-off point for future agents. Do not rebuild the app from
an older PR or re-enable the classic skin.

## Client-approved baseline — 20 July 2026

- The client has approved the current production UI and functionality as the
  canonical STADIO baseline.
- Stardial is the product's sole primary/default UI. It is no longer a theme,
  alternate look, experiment, or optional mode.
- The exact approved and deployed runtime is permanently marked by Git tag
  `stadio-approved-baseline-2026-07-20` at commit
  `14f040057260d2f24d6f0dc4e0ca427a8507229b`.
- Future work must start from `main` and preserve this behaviour unless the
  client explicitly requests a change. Never restore code from a superseded
  branch over `main`.
- Documentation-only commits after this marker do not change the approved
  production runtime.

## One production interface

- Stardial is the only runtime interface. The classic/Stardial switch was
  removed to prevent browser storage or a URL parameter restoring old UI.
- Runtime source contains no pictographic interface icons. Labels are words,
  and readable content is left-aligned.
- Tournament controls include independent match start/timer controls, explicit
  second half, score correction, soccer scorer selection, direct netball
  scoring, and sin-bin countdowns: yellow 2 minutes; red 10 minutes.

## Role links and manager isolation

- Viewer: `https://stadio-sports-day-2026.web.app/`
- Scorekeeper: `https://stadio-sports-day-2026.web.app/?role=scorekeeper`
- Manager example: `https://stadio-sports-day-2026.web.app/?role=manager&team=durbanville`

A manager session receives all campus names needed for fixtures and standings,
but subscribes only to its assigned campus roster and private-profile
subcollection. Team and Travel views are filtered to that campus. Player rows
open the dynamic private player card.

## Live test mode and security warning

The deployed build uses Firestore real-time data when `.env.local` supplies the
existing Firebase web configuration. The project is
`stadio-sports-day-2026`; do not create a replacement Firebase project.

There is no Firebase Auth sign-in/custom-claims flow. During the client-approved
live-data test, `firestore.rules` therefore allows public reads/writes needed by
the link-gated roles, including private player profiles. UI isolation is in
place, but direct database access is not secure. This is a critical, temporary
test-only compromise and must not be represented as true access control.

## Flash workflow — never run without the client's explicit instruction

Dry-run, which performs no writes:

```bash
npm run flash:test-data:dry-run
```

Actual reset, only after the client explicitly says **clear data**:

```bash
node scripts/flash-test-data.mjs --confirm
```

The flash resets fixtures, clocks, scorers, cards, attendance, travel,
announcements and event status. It preserves team rosters and private player
profiles.

## Confirmed missing inputs from the live-data audit

- All 32 submitted soccer players have the expected shirt number in Firestore.
- All 29 live netball roster entries lack shirt numbers: Durbanville 10,
  Musgrave 10, Waterfall 9.
- Centurion has no netball roster and no private player profiles in Firestore.
- Durbanville support member Shane Christians has no soccer shirt number. This
  is probably correct for support staff, but confirm if he will play.

## Git history consolidation

- Tracking issue: <https://github.com/Chadaden/StadioSports/issues/4>
- PRs #5 and #6 were superseded during consolidation.
- PR #7 consolidated the live-data workflow, tournament controls, manager
  isolation, and sole Stardial interface.
- PR #8 completed manager private-profile readiness.
- PR #9 fixed the player-card viewport and is the approved deployed runtime.
- Superseded remote working branches were removed after the approved tag was
  pushed. `main` is the only continuing source branch.

## Release verification

Before deployment, run `npm test`, `npm run lint`, and `npm run build`; verify
the Firebase project/login; run the flash command without `--confirm`; then
check viewer, scorekeeper, and at least Durbanville manager URLs in a browser.
Deploy Hosting and the explicitly approved temporary Firestore rules only.
