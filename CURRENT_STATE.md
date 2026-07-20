# STADIO Sports Day — canonical current state

This file is the hand-off point for future agents. Do not rebuild the app from
an older PR or re-enable the classic skin.

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
- PR #5 held the live-data/flash work.
- PR #6 held the tournament-control deployment.
- `claude/stardial-ui-redesign-f2v3ox` held the final Stardial UI cleanup.
- The consolidation PR supersedes all three lines and is the only branch that
  should be merged/deployed.

## Release verification

Before deployment, run `npm test`, `npm run lint`, and `npm run build`; verify
the Firebase project/login; run the flash command without `--confirm`; then
check viewer, scorekeeper, and at least Durbanville manager URLs in a browser.
Deploy Hosting and the explicitly approved temporary Firestore rules only.
