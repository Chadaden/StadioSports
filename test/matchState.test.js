import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activateSportState,
  addGoalState,
  addSinBinCardState,
  adjustScoreState,
  attributeScorerState,
  canPublishSport,
  canStartSecondHalf,
  finalChampion,
  finalChampions,
  fixtureOverallStatus,
  headlinePairing,
  isAlarmActive,
  pauseClockState,
  resetClockState,
  reopenSportState,
  removeGoalState,
  removeLatestGoalState,
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

test('second half starts fresh at 0:00 even if the first half overran before the referee stopped it', () => {
  const firstHalf = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 615 } }
  const secondHalf = startSecondHalfState(firstHalf, '2026-07-17T10:15:00.000Z')
  assert.equal(secondHalf.clock.phase, 'h2')
  assert.equal(secondHalf.clock.runningSince, '2026-07-17T10:15:00.000Z')
  assert.equal(secondHalf.clock.baseSeconds, 0)
})

test('the second half cannot start before a paused first half reaches ten minutes', () => {
  const shortFirstHalf = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 15 } }
  assert.equal(canStartSecondHalf(shortFirstHalf), false)
  assert.deepEqual(startSecondHalfState(shortFirstHalf, '2026-07-17T10:15:00.000Z'), shortFirstHalf)

  const completeFirstHalf = { ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 600 } }
  assert.equal(canStartSecondHalf(completeFirstHalf), true)
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
  // Full-time fires at the second half's own 10-minute mark.
  assert.equal(isAlarmActive({ phase: 'h2', runningSince: '2026-07-17T10:15:00.000Z', baseSeconds: 0 }, Date.parse('2026-07-17T10:24:59.000Z')), false)
  assert.equal(isAlarmActive({ phase: 'h2', runningSince: '2026-07-17T10:15:00.000Z', baseSeconds: 0 }, Date.parse('2026-07-17T10:25:00.000Z')), true)
})

test('standard publishing is available only after a paused second half reaches ten minutes', () => {
  const normal = { allowInstantPublish: false }
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 600 } }, Date.now(), normal), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h2', runningSince: '2026-07-17T10:00:00.000Z', baseSeconds: 600 } }, Date.now(), normal), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h2', runningSince: null, baseSeconds: 599 } }, Date.now(), normal), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h2', runningSince: null, baseSeconds: 615 } }, Date.now(), normal), true)
})

test('publishing defaults to the standard gate now the demo bypass window is closed', () => {
  // DEMO_INSTANT_PUBLISH_ENABLED is off for the real event — calling without
  // an explicit override must fall through to the standard 10-minute gate,
  // not the demo bypass, so a scorekeeper can no longer publish a match
  // before it's actually finished.
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 12 } }), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'upcoming' }), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'final' }), false)
})

test('the instant-publish override still works when explicitly requested', () => {
  const demo = { allowInstantPublish: true }
  assert.equal(canPublishSport({ ...baseSport(), status: 'upcoming' }, Date.now(), demo), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'final' }, Date.now(), demo), false)
  assert.equal(canPublishSport({ ...baseSport(), status: 'live', clock: { phase: 'h1', runningSince: null, baseSeconds: 12 } }, Date.now(), demo), true)
})

test('reopening a final preserves its elapsed second half and allows it to be published again', () => {
  const reopened = reopenSportState({
    ...baseSport(), status: 'final', clock: { phase: 'ft', runningSince: null, baseSeconds: 615 },
  })
  assert.equal(reopened.status, 'live')
  assert.deepEqual(reopened.clock, { phase: 'h2', runningSince: null, baseSeconds: 615 })
  assert.equal(canPublishSport(reopened), true)
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

test('netball score correction works for either side and never drops below zero', () => {
  const centurionFixtureSport = { ...baseSport(), status: 'live' }
  const homeGoal = adjustScoreState(centurionFixtureSport, 'home', 1)
  const awayGoal = adjustScoreState(homeGoal, 'away', 1)
  const corrected = adjustScoreState(awayGoal, 'home', -1)
  const clamped = adjustScoreState(corrected, 'home', -1)
  assert.equal(awayGoal.home, 1)
  assert.equal(awayGoal.away, 1)
  assert.equal(clamped.home, 0)
})

test('a netball goal records the scoring side for later team-specific attribution', () => {
  const scored = addGoalState(baseSport(), 'away', {
    playerId: null, teamId: 'waterfall', name: null, minute: 4,
  })
  assert.equal(scored.home, 0)
  assert.equal(scored.away, 1)
  assert.equal(scored.scorers.length, 1)
  assert.equal(typeof scored.scorers[0].id, 'string')
  assert.ok(scored.scorers[0].id.length > 0)
  assert.deepEqual(
    { ...scored.scorers[0], id: undefined },
    { id: undefined, playerId: null, teamId: 'waterfall', name: null, minute: 4 },
  )
  assert.deepEqual(
    attributeScorerState(scored, scored.scorers[0].id, { playerId: 'wat-07', name: 'Tayler Skye Thomas' }).scorers[0],
    { ...scored.scorers[0], playerId: 'wat-07', name: 'Tayler Skye Thomas' },
  )
})

test('addGoalState assigns each scorer a distinct stable id', () => {
  const one = addGoalState(baseSport(), 'home', { playerId: null, teamId: 'centurion', name: null, minute: 1 })
  const two = addGoalState(one, 'home', { playerId: null, teamId: 'centurion', name: null, minute: 2 })
  const [first, second] = two.scorers
  assert.notEqual(first.id, second.id)
})

test('removing a netball goal removes that side’s latest scorer event too', () => {
  const sport = {
    ...baseSport(), away: 2,
    scorers: [
      { teamId: 'waterfall', name: 'First scorer' },
      { teamId: 'centurion', name: 'Home scorer' },
      { teamId: 'waterfall', name: 'Latest scorer' },
    ],
  }
  const corrected = removeLatestGoalState(sport, 'away', 'waterfall')
  assert.equal(corrected.away, 1)
  assert.deepEqual(corrected.scorers.map((scorer) => scorer.name), ['First scorer', 'Home scorer'])
})

test('attributing a scorer edits one entry in place without touching the score or other entries', () => {
  const sport = {
    ...baseSport(), status: 'live', home: 2, away: 0,
    scorers: [
      { id: 's1', playerId: null, teamId: 'musgrave', name: null, minute: 12 },
      { id: 's2', playerId: null, teamId: 'musgrave', name: null, minute: 34 },
    ],
  }
  const attributed = attributeScorerState(sport, 's2', { playerId: 'mus-02', name: 'Hamza Amla' })
  assert.equal(attributed.home, 2)
  assert.equal(attributed.away, 0)
  assert.equal(attributed.scorers[0].name, null)
  assert.equal(attributed.scorers[1].name, 'Hamza Amla')
  assert.equal(attributed.scorers[1].playerId, 'mus-02')
})

test('attributing an unknown scorer id is a no-op', () => {
  const sport = { ...baseSport(), scorers: [{ id: 's1', teamId: 'musgrave', name: null }] }
  const unchanged = attributeScorerState(sport, 'does-not-exist', { playerId: 'x', name: 'X' })
  assert.deepEqual(unchanged, sport)
})

test('removeGoalState drops the matching scorer and decrements the right side by its own id', () => {
  const sport = {
    ...baseSport(), home: 1, away: 1,
    scorers: [
      { id: 'g1', teamId: 'centurion', name: 'Home scorer' },
      { id: 'g2', teamId: 'waterfall', name: 'Away scorer' },
    ],
  }
  const corrected = removeGoalState(sport, 'g2', 'waterfall')
  assert.equal(corrected.home, 1)
  assert.equal(corrected.away, 0)
  assert.deepEqual(corrected.scorers.map((sc) => sc.id), ['g1'])
})

test('removeGoalState is a no-op for an id that no longer exists', () => {
  const sport = { ...baseSport(), away: 1, scorers: [{ id: 'g1', teamId: 'waterfall', name: 'Scorer' }] }
  const unchanged = removeGoalState(sport, 'already-removed', 'waterfall')
  assert.deepEqual(unchanged, sport)
})

test('removing/attributing by id is unaffected when a concurrent edit shifts array positions', () => {
  // Two scorekeeper devices see the same three-goal state. Device A removes
  // the middle goal (g2) first; its write lands. Device B, still showing the
  // original three-entry array, then attributes what it displayed as index 2
  // (g3) — by id this still hits g3 correctly, where an index-based write
  // would have landed on whatever shifted into index 2 after g2's removal.
  const original = {
    ...baseSport(), home: 1, away: 2,
    scorers: [
      { id: 'g1', teamId: 'centurion', name: null },
      { id: 'g2', teamId: 'waterfall', name: null },
      { id: 'g3', teamId: 'waterfall', name: null },
    ],
  }
  const afterDeviceARemoval = removeGoalState(original, 'g2', 'waterfall')
  assert.deepEqual(afterDeviceARemoval.scorers.map((sc) => sc.id), ['g1', 'g3'])

  const afterDeviceBAttribution = attributeScorerState(
    afterDeviceARemoval, 'g3', { playerId: 'wat-01', name: 'Correct Scorer' },
  )
  assert.equal(afterDeviceBAttribution.scorers.find((sc) => sc.id === 'g3').name, 'Correct Scorer')
  assert.equal(afterDeviceBAttribution.scorers.find((sc) => sc.id === 'g1').name, null)
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

test('fixtureOverallStatus is final only once both sports are, live if either is', () => {
  assert.equal(
    fixtureOverallStatus({ soccer: { status: 'upcoming' }, netball: { status: 'upcoming' } }),
    'upcoming',
  )
  assert.equal(
    fixtureOverallStatus({ soccer: { status: 'live' }, netball: { status: 'upcoming' } }),
    'live',
  )
  assert.equal(
    fixtureOverallStatus({ soccer: { status: 'final' }, netball: { status: 'live' } }),
    'live',
  )
  assert.equal(
    fixtureOverallStatus({ soccer: { status: 'final' }, netball: { status: 'upcoming' } }),
    'upcoming',
  )
  assert.equal(
    fixtureOverallStatus({ soccer: { status: 'final' }, netball: { status: 'final' } }),
    'final',
  )
  assert.equal(fixtureOverallStatus(undefined), 'upcoming')
})

test('finalChampion resolves each sport champion only from a published final', () => {
  const teams = [
    { id: 'centurion', name: 'Centurion' },
    { id: 'musgrave', name: 'Musgrave' },
    { id: 'waterfall', name: 'Waterfall' },
  ]
  const fixtures = [
    {
      id: 'm8',
      round: 'final',
      homeTeamId: null,
      awayTeamId: null,
      soccer: { status: 'final', home: 2, away: 1, homeTeamId: 'centurion', awayTeamId: 'musgrave' },
      netball: { status: 'final', home: 11, away: 16, homeTeamId: 'waterfall', awayTeamId: 'centurion' },
    },
  ]

  assert.equal(finalChampion('soccer', fixtures, teams).team.name, 'Centurion')
  assert.equal(finalChampion('netball', fixtures, teams).team.name, 'Centurion')
  assert.deepEqual(finalChampions(fixtures, teams).map((champion) => champion.sport), ['soccer', 'netball'])
  assert.equal(finalChampion('soccer', [{ ...fixtures[0], soccer: { ...fixtures[0].soccer, status: 'live' } }], teams), null)
  assert.equal(finalChampion('soccer', [{ ...fixtures[0], soccer: { ...fixtures[0].soccer, home: 1, away: 1 } }], teams), null)
})
