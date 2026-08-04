import test from 'node:test'
import assert from 'node:assert/strict'

import {
  HALF_SECONDS,
  activateSportState,
  addSinBinCardState,
  adjustScoreState,
  attributeScorerState,
  headlinePairing,
  isAlarmActive,
  pauseClockState,
  resetClockState,
  resumeClockState,
  sinBinRemainingSeconds,
  sportHomeAwayIds,
  startClockState,
  startSecondHalfState,
} from '../src/lib/matchState.js'

const baseSport = () => ({ status: 'upcoming', home: 0, away: 0, scorers: [], cards: [] })

test('opening a match exposes controls without auto-starting its timer', () => {
  const sport = activateSportState(baseSport())
  assert.equal(sport.status, 'live')
  assert.deepEqual(sport.clock, { phase: 'h1', runningSince: null, baseSeconds: 0 })
})

test('start, pause, and resume are separate and preserve the current half', () => {
  const started = startClockState(activateSportState(baseSport()), '2026-07-17T10:00:00.000Z')
  assert.equal(started.clock.phase, 'h1')
  assert.equal(started.clock.runningSince, '2026-07-17T10:00:00.000Z')
  const paused = pauseClockState(started, Date.parse('2026-07-17T10:03:15.000Z'))
  assert.equal(paused.clock.phase, 'h1')
  assert.equal(paused.clock.runningSince, null)
  assert.equal(paused.clock.baseSeconds, 195)
  const resumed = resumeClockState(paused, '2026-07-17T10:04:00.000Z')
  assert.equal(resumed.clock.phase, 'h1')
  assert.equal(resumed.clock.runningSince, '2026-07-17T10:04:00.000Z')
})

test('second half is explicit and starts from the 10-minute boundary', () => {
  const firstHalf = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 575 } }
  const secondHalf = startSecondHalfState(firstHalf, '2026-07-17T10:15:00.000Z')
  assert.equal(secondHalf.clock.phase, 'h2')
  assert.equal(secondHalf.clock.runningSince, '2026-07-17T10:15:00.000Z')
  assert.equal(secondHalf.clock.baseSeconds, HALF_SECONDS)
})

test('reset stops the timer and restores the first half without changing scores', () => {
  const sport = { ...baseSport(), status: 'live', home: 2, away: 1, clock: { phase: 'h2', runningSince: '2026-07-17T10:15:00.000Z', baseSeconds: 600 } }
  const reset = resetClockState(sport)
  assert.deepEqual(reset.clock, { phase: 'h1', runningSince: null, baseSeconds: 0 })
  assert.equal(reset.home, 2)
  assert.equal(reset.away, 1)
})

test('the halftime/full-time alarm fires once the half in progress reaches its own 10-minute mark, while running', () => {
  assert.equal(isAlarmActive({ phase: 'h1', runningSince: '2026-07-17T10:00:00.000Z', baseSeconds: 0 }, Date.parse('2026-07-17T10:09:59.000Z')), false)
  assert.equal(isAlarmActive({ phase: 'h1', runningSince: '2026-07-17T10:00:00.000Z', baseSeconds: 0 }, Date.parse('2026-07-17T10:10:00.000Z')), true)
  // Full-time shares the same mechanism, at the second half's own 10-minute mark.
  assert.equal(isAlarmActive({ phase: 'h2', runningSince: '2026-07-17T10:15:00.000Z', baseSeconds: HALF_SECONDS }, Date.parse('2026-07-17T10:24:59.000Z')), false)
  assert.equal(isAlarmActive({ phase: 'h2', runningSince: '2026-07-17T10:15:00.000Z', baseSeconds: HALF_SECONDS }, Date.parse('2026-07-17T10:25:00.000Z')), true)
})

test('pressing Pause silences the alarm even past the 10-minute mark', () => {
  assert.equal(isAlarmActive({ phase: 'h1', runningSince: null, baseSeconds: 650 }), false)
  assert.equal(isAlarmActive({ phase: 'h2', runningSince: null, baseSeconds: 1300 }), false)
})

test('yellow and red cards start their sin-bin countdown at 2 and 10 minutes while the game clock runs', () => {
  const issuedAt = '2026-07-17T10:00:00.000Z'
  const live = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: issuedAt, baseSeconds: 0 } }
  const withYellow = addSinBinCardState(live, { type: 'yellow', name: 'Player A' }, issuedAt)
  const withRed = addSinBinCardState(withYellow, { type: 'red', name: 'Player B' }, issuedAt)
  const [yellow, red] = withRed.cards
  assert.equal(yellow.sinBinSeconds, 120)
  assert.equal(red.sinBinSeconds, 600)
  assert.equal(yellow.sinBinRunningSince, issuedAt)
  assert.equal(sinBinRemainingSeconds(yellow, Date.parse('2026-07-17T10:01:30.000Z')), 30)
  assert.equal(sinBinRemainingSeconds(red, Date.parse('2026-07-17T10:01:30.000Z')), 510)
  assert.equal(sinBinRemainingSeconds(yellow, Date.parse('2026-07-17T10:03:00.000Z')), 0)
})

test('legacy wall-clock sin-bin records (no baseSeconds field) still display correctly', () => {
  // Regression guard for test/sinBinCountdown.regression-1.test.js's shape.
  const issuedAt = '2026-07-17T10:00:00.000Z'
  assert.equal(sinBinRemainingSeconds({ type: 'yellow', issuedAt }, Date.parse('2026-07-17T10:01:30.000Z')), 30)
})

test('a card issued while the clock is stopped does not start counting down until Start/Resume', () => {
  const stopped = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 0 } }
  const withCard = addSinBinCardState(stopped, { type: 'yellow', name: 'Player A' }, '2026-07-17T10:00:00.000Z')
  const [card] = withCard.cards
  assert.equal(card.sinBinRunningSince, null)
  assert.equal(sinBinRemainingSeconds(card, Date.parse('2026-07-17T10:05:00.000Z')), 120)
})

test('pausing the game clock also freezes any active sin-bin timers; resuming moves them together', () => {
  const issuedAt = '2026-07-17T10:00:00.000Z'
  const live = startClockState(activateSportState(baseSport()), issuedAt)
  const carded = addSinBinCardState(live, { type: 'yellow', name: 'Player A' }, issuedAt)

  // 90 seconds in, pause: 30 of the 120 seconds should remain, frozen.
  const paused = pauseClockState(carded, Date.parse('2026-07-17T10:01:30.000Z'))
  assert.equal(paused.cards[0].sinBinRunningSince, null)
  assert.equal(sinBinRemainingSeconds(paused.cards[0], Date.parse('2026-07-17T10:01:30.000Z')), 30)
  // Time passing while paused must not cost the card any more seconds.
  assert.equal(sinBinRemainingSeconds(paused.cards[0], Date.parse('2026-07-17T10:05:00.000Z')), 30)

  // Resume: the sin-bin picks back up from its banked 30 seconds, not reset.
  const resumed = resumeClockState(paused, '2026-07-17T10:05:00.000Z')
  assert.equal(resumed.cards[0].sinBinRunningSince, '2026-07-17T10:05:00.000Z')
  assert.equal(sinBinRemainingSeconds(resumed.cards[0], Date.parse('2026-07-17T10:05:00.000Z')), 30)
  assert.equal(sinBinRemainingSeconds(resumed.cards[0], Date.parse('2026-07-17T10:05:20.000Z')), 10)
  assert.equal(sinBinRemainingSeconds(resumed.cards[0], Date.parse('2026-07-17T10:05:30.000Z')), 0)
})

test('a sin-bin still owed at halftime carries its remainder into the second half', () => {
  const issuedAt = '2026-07-17T10:09:00.000Z' // 1 minute left in the first half
  const live = startClockState(activateSportState(baseSport()), '2026-07-17T10:00:00.000Z')
  const carded = addSinBinCardState(live, { type: 'yellow', name: 'Player A' }, issuedAt)
  // Halftime reached at 10:10:00 with 60s served, 60s owed. Pause.
  const paused = pauseClockState(carded, Date.parse('2026-07-17T10:10:00.000Z'))
  assert.equal(sinBinRemainingSeconds(paused.cards[0], Date.parse('2026-07-17T10:10:00.000Z')), 60)
  // Second half kicks off — the sin-bin resumes with its banked remainder,
  // independent of the game clock jumping back to the 10-minute mark.
  const secondHalf = startSecondHalfState(paused, '2026-07-17T10:15:00.000Z')
  assert.equal(secondHalf.cards[0].sinBinRunningSince, '2026-07-17T10:15:00.000Z')
  assert.equal(sinBinRemainingSeconds(secondHalf.cards[0], Date.parse('2026-07-17T10:15:00.000Z')), 60)
  assert.equal(sinBinRemainingSeconds(secondHalf.cards[0], Date.parse('2026-07-17T10:16:00.000Z')), 0)
})

test('resetting the game clock does not touch sin-bin timers', () => {
  const issuedAt = '2026-07-17T10:00:00.000Z'
  const live = startClockState(activateSportState(baseSport()), issuedAt)
  const carded = addSinBinCardState(live, { type: 'yellow', name: 'Player A' }, issuedAt)
  const reset = resetClockState(carded)
  assert.deepEqual(reset.cards, carded.cards)
})

test('direct netball scoring works for either side and never drops below zero', () => {
  const centurionFixtureSport = { ...baseSport(), status: 'live' }
  const homeGoal = adjustScoreState(centurionFixtureSport, 'home', 1)
  const awayGoal = adjustScoreState(homeGoal, 'away', 1)
  const corrected = adjustScoreState(awayGoal, 'home', -1)
  const clamped = adjustScoreState(corrected, 'home', -1)
  assert.equal(awayGoal.home, 1)
  assert.equal(awayGoal.away, 1)
  assert.equal(clamped.home, 0)
})

test('attributing a scorer edits one entry in place without touching the score or other entries', () => {
  const sport = {
    ...baseSport(), status: 'live', home: 2, away: 0,
    scorers: [
      { playerId: null, teamId: 'musgrave', name: null, minute: 12 },
      { playerId: null, teamId: 'musgrave', name: null, minute: 34 },
    ],
  }
  const attributed = attributeScorerState(sport, 1, { playerId: 'mus-02', name: 'Hamza Amla' })
  assert.equal(attributed.home, 2)
  assert.equal(attributed.away, 0)
  assert.equal(attributed.scorers[0].name, null)
  assert.equal(attributed.scorers[1].name, 'Hamza Amla')
  assert.equal(attributed.scorers[1].playerId, 'mus-02')
})

test('attributing an out-of-range index is a no-op', () => {
  const sport = { ...baseSport(), scorers: [{ teamId: 'musgrave', name: null }] }
  const unchanged = attributeScorerState(sport, 5, { playerId: 'x', name: 'X' })
  assert.deepEqual(unchanged, sport)
})

test('sportHomeAwayIds falls back to the fixture-level pairing until a sport auto-populates its own', () => {
  const roundRobinFixture = { homeTeamId: 'centurion', awayTeamId: 'waterfall', soccer: {}, netball: {} }
  assert.deepEqual(sportHomeAwayIds(roundRobinFixture, 'soccer'), { homeTeamId: 'centurion', awayTeamId: 'waterfall' })

  const playoffFixture = {
    homeTeamId: null, awayTeamId: null,
    soccer: { homeTeamId: 'musgrave', awayTeamId: 'centurion' },
    netball: { homeTeamId: 'waterfall', awayTeamId: 'durbanville' },
  }
  assert.deepEqual(sportHomeAwayIds(playoffFixture, 'soccer'), { homeTeamId: 'musgrave', awayTeamId: 'centurion' })
  assert.deepEqual(sportHomeAwayIds(playoffFixture, 'netball'), { homeTeamId: 'waterfall', awayTeamId: 'durbanville' })
})

test('headlinePairing prefers the fixture-level pairing, else the first sport with one', () => {
  assert.deepEqual(
    headlinePairing({ homeTeamId: 'centurion', awayTeamId: 'waterfall' }),
    { homeTeamId: 'centurion', awayTeamId: 'waterfall' },
  )
  assert.deepEqual(
    headlinePairing({
      homeTeamId: null,
      awayTeamId: null,
      soccer: { homeTeamId: null, awayTeamId: null },
      netball: { homeTeamId: 'waterfall', awayTeamId: 'durbanville' },
    }),
    { homeTeamId: 'waterfall', awayTeamId: 'durbanville' },
  )
  assert.deepEqual(
    headlinePairing({ homeTeamId: null, awayTeamId: null, soccer: {}, netball: {} }),
    { homeTeamId: null, awayTeamId: null },
  )
})
