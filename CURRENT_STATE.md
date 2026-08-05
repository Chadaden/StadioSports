# STADIO Sports Day — canonical current state

This file is the hand-off point for future agents. Do not rebuild the app from
an older PR or re-enable the classic skin.

## Live now — 4 August 2026 (supersedes the baseline below)

- **What's actually deployed:** branch `fix/DAW-34-scorekeeper-finalisation`,
  tracked by [PR #11](https://github.com/Chadaden/StadioSports/pull/11) — not
  `main`. `main` is still at the 20 July baseline (`14f0400`) and is missing
  everything below. Until PR #11 merges, treat
  `fix/DAW-34-scorekeeper-finalisation` (not `main`) as the branch to
  continue from.
- **What shipped today**, in order, each built/tested/deployed individually:
  - `3194d96`/`ba5dba6`/`90e964c`/`2ba98d6`/`1819407`/`aeaf3fe`/`051ebe4`/`18ee50b`
    — the halftime/full-time alarm, pause-synced sin-bins, deferred scorer
    attribution, tournament round-robin → knockout auto-population, and the
    laptop scorekeeper workspace (§ STADIO-change-spec.md Part A). This is the
    work the rest of this file's "20 July" baseline predates.
  - `9e8223c` — Publish/Reset were gated behind `window.confirm()`, which
    returns `false` silently in some tablet/PWA contexts with no error shown.
    Replaced with an in-app two-tap confirm.
  - `8c0fafa` — the real publish bug: `publishSport`'s live-mode transaction
    called `transaction.get()` on a whole-collection Query, which the
    Firestore Web SDK doesn't support for transactions — it threw on every
    call, and because the write action was never awaited/caught, the failure
    was completely silent. Fixed by reading each fixture individually.
    Reproduced and verified live against production before and after.
  - `b5dffa1` — Match-day reference panel sticky-position bug (grid
    auto-placement was pushing it into whatever row Published Games landed
    on), Schedule tab wired to real fixture status (it was a fully static
    render before — published results never showed there), Fixtures/Schedule
    card layout made full-width/symmetric (time+dot moved off into a label
    above the card instead of a reserved side column), live-card pulse, and
    bottom tab bar centering.
- **Not done / open follow-ups:** PR #11 not yet merged; `main` not updated;
  user mentioned intending to make their own small mobile UI tweaks
  separately. A stray player name in live Firestore data reads literally
  "Bono hyphen Kholophe" — looks like a data-import artifact, not a code bug;
  unconfirmed whether it's real or test data.

## Client-approved baseline — 20 July 2026

- The client has approved the current production UI and functionality as the
  canonical STADIO baseline.
- Stardial is the product's sole primary/default UI. It is no longer a theme,
  alternate look, experiment, or optional mode.
- The exact approved and deployed runtime is permanently marked by Git tag
  `stadio-approved-baseline-2026-07-20` at commit
  `14f040057260d2f24d6f0dc4e0ca427a8507229b`.
- **Superseded 4 August 2026 — see the section above.** This paragraph
  originally said future work must start from `main`; that's no longer true,
  since `main` was never updated with the 4 August work and isn't what's
  deployed. Start from `fix/DAW-34-scorekeeper-finalisation` instead until
  that branch is merged. The "never restore a superseded branch over `main`"
  rule below still holds in spirit — don't drop *this* branch's work either.
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
  pushed, and at the time this was written `main` was the only continuing
  source branch. That changed 4 August 2026 — see "Live now" at the top of
  this file.
- PR #11 tracks `fix/DAW-34-scorekeeper-finalisation` — tournament
  auto-population, publish-flow fixes, and UI polish. Not yet merged.

## Release verification

Before deployment, run `npm test`, `npm run lint`, and `npm run build`; verify
the Firebase project/login; run the flash command without `--confirm`; then
check viewer, scorekeeper, and at least Durbanville manager URLs in a browser.
Deploy Hosting and the explicitly approved temporary Firestore rules only.
