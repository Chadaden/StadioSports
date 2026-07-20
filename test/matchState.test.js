import test from 'node:test'
import assert from 'node:assert/strict'

import {
  HALF_SECONDS,
  activateSportState,
  addSinBinCardState,
  adjustScoreState,
  pauseClockState,
  resetClockState,
  resumeClockState,
  shouldAlertFirstHalfEnd,
  sinBinRemainingSeconds,
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

test('the first-half threshold alerts once it reaches 10 minutes', () => {
  assert.equal(shouldAlertFirstHalfEnd({ phase: 'h1', runningSince: null, baseSeconds: 599 }), false)
  assert.equal(shouldAlertFirstHalfEnd({ phase: 'h1', runningSince: null, baseSeconds: 600 }), true)
  assert.equal(shouldAlertFirstHalfEnd({ phase: 'h2', runningSince: null, baseSeconds: 600 }), false)
})

test('yellow and red cards receive wall-clock sin-bin countdowns of 2 and 10 minutes', () => {
  const issuedAt = '2026-07-17T10:00:00.000Z'
  const withYellow = addSinBinCardState(baseSport(), { type: 'yellow', name: 'Player A' }, issuedAt)
  const withRed = addSinBinCardState(withYellow, { type: 'red', name: 'Player B' }, issuedAt)
  const [yellow, red] = withRed.cards
  assert.equal(yellow.sinBinSeconds, 120)
  assert.equal(red.sinBinSeconds, 600)
  assert.equal(sinBinRemainingSeconds(yellow, Date.parse('2026-07-17T10:01:30.000Z')), 30)
  assert.equal(sinBinRemainingSeconds(red, Date.parse('2026-07-17T10:01:30.000Z')), 510)
  assert.equal(sinBinRemainingSeconds(yellow, Date.parse('2026-07-17T10:03:00.000Z')), 0)
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
