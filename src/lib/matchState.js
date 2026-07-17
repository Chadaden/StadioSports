// Pure match-state transitions shared by both scorekeeper skins.
// Keeping time derivation here makes the critical controls regression-testable
// without React or Firebase.

export const HALF_SECONDS = 10 * 60
export const CARD_SIN_BIN_SECONDS = { yellow: 2 * 60, red: 10 * 60 }

export const stoppedFirstHalfClock = () => ({
  phase: 'h1',
  runningSince: null,
  baseSeconds: 0,
})

export function elapsedClockSeconds(clock, now = Date.now()) {
  if (!clock) return 0
  const base = Number(clock.baseSeconds) || 0
  if (!clock.runningSince) return base
  const startedAt = Date.parse(clock.runningSince)
  if (!Number.isFinite(startedAt)) return base
  return base + Math.max(0, (now - startedAt) / 1000)
}

export function activateSportState(sport) {
  return {
    ...sport,
    status: 'live',
    clock: sport.clock || stoppedFirstHalfClock(),
  }
}

export function startClockState(sport, startedAt = new Date().toISOString()) {
  const clock = sport.clock || stoppedFirstHalfClock()
  if (clock.runningSince) return sport
  return {
    ...sport,
    clock: {
      ...clock,
      // Legacy records used `paused` only after pausing the second half.
      phase: clock.phase === 'paused' ? 'h2' : clock.phase,
      runningSince: startedAt,
    },
  }
}

export function pauseClockState(sport, now = Date.now()) {
  if (!sport.clock?.runningSince) return sport
  return {
    ...sport,
    clock: {
      ...sport.clock,
      runningSince: null,
      baseSeconds: Math.round(elapsedClockSeconds(sport.clock, now)),
    },
  }
}

export const resumeClockState = startClockState

export function startSecondHalfState(sport, startedAt = new Date().toISOString()) {
  const elapsed = Math.round(elapsedClockSeconds(sport.clock, Date.parse(startedAt)))
  return {
    ...sport,
    clock: {
      phase: 'h2',
      runningSince: startedAt,
      baseSeconds: Math.max(HALF_SECONDS, elapsed),
    },
  }
}

export function resetClockState(sport) {
  return { ...sport, clock: stoppedFirstHalfClock() }
}

export function adjustScoreState(sport, side, delta) {
  if (side !== 'home' && side !== 'away') return sport
  return {
    ...sport,
    status: sport.status === 'upcoming' ? 'live' : sport.status,
    clock: sport.clock || stoppedFirstHalfClock(),
    [side]: Math.max(0, (Number(sport[side]) || 0) + delta),
  }
}

export function shouldAlertFirstHalfEnd(clock, now = Date.now()) {
  return clock?.phase === 'h1' && elapsedClockSeconds(clock, now) >= HALF_SECONDS
}

export function addSinBinCardState(sport, card, issuedAt = new Date().toISOString()) {
  const sinBinSeconds = CARD_SIN_BIN_SECONDS[card.type] || 0
  return {
    ...sport,
    cards: [
      ...(sport.cards || []),
      {
        ...card,
        issuedAt,
        sinBinStartedAt: issuedAt,
        sinBinSeconds,
      },
    ],
  }
}

export function sinBinRemainingSeconds(card, now = Date.now()) {
  const duration = Number(card?.sinBinSeconds) || CARD_SIN_BIN_SECONDS[card?.type] || 0
  const rawStartedAt = card?.sinBinStartedAt ?? card?.issuedAt
  const startedAt = typeof rawStartedAt === 'number' ? rawStartedAt : Date.parse(rawStartedAt)
  if (!duration || !Number.isFinite(startedAt)) return 0
  return Math.min(duration, Math.max(0, Math.ceil(duration - (now - startedAt) / 1000)))
}

export function formatDurationSeconds(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
