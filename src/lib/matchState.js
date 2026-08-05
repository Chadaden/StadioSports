// Pure match-state transitions shared by both scorekeeper skins.
// Keeping time derivation here makes the critical controls regression-testable
// without React or Firebase.

export const HALF_SECONDS = 10 * 60
export const CARD_SIN_BIN_SECONDS = { yellow: 2 * 60, red: 10 * 60 }
// Temporary client-demo bypass for 6 Aug stakeholder meeting: scorekeepers can
// publish a live sport immediately after simulating a few goals. Remove once
// Chad confirms the demo window is closed.
export const DEMO_INSTANT_PUBLISH_ENABLED = true

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
    cards: resumeSinBinCards(sport.cards, startedAt, Date.parse(startedAt)),
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
    cards: pauseSinBinCards(sport.cards, now),
  }
}

export const resumeClockState = startClockState

export function startSecondHalfState(sport, startedAt = new Date().toISOString()) {
  if (!canStartSecondHalf(sport, Date.parse(startedAt))) return sport
  return {
    ...sport,
    clock: {
      phase: 'h2',
      runningSince: startedAt,
      baseSeconds: 0,
    },
    cards: resumeSinBinCards(sport.cards, startedAt, Date.parse(startedAt)),
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

// Deferred scorer attribution (§5, soccer): the goal itself already went live
// on tap via addGoal with an unknown/null scorer. This only ever edits the
// name/playerId on one already-logged scorers[] entry in place — it never
// touches the score, and any entry (not just the most recent) stays
// individually attributable.
export function attributeScorerState(sport, index, attribution) {
  const scorers = sport.scorers || []
  if (!scorers[index]) return sport
  return {
    ...sport,
    scorers: scorers.map((sc, i) => (i === index ? { ...sc, ...attribution } : sc)),
  }
}

// Halftime AND full-time share one mechanism (§1): once the half in progress
// reaches its 10-minute mark the scorekeeper panel flashes, and stays flashing
// until Pause is pressed — which is exactly when the clock stops running, so
// silencing the alarm falls straight out of `runningSince` going null. The
// clock itself is never frozen at 10:00; it keeps counting while it flashes.
export function isAlarmActive(clock, now = Date.now()) {
  if (!clock?.runningSince) return false
  const elapsed = elapsedClockSeconds(clock, now)
  if (clock.phase === 'h1') return elapsed >= HALF_SECONDS
  if (clock.phase === 'h2') return elapsed >= HALF_SECONDS
  return false
}

export function canStartSecondHalf(sport, now = Date.now()) {
  const clock = sport?.clock
  return sport?.status === 'live'
    && clock?.phase === 'h1'
    && !clock.runningSince
    && elapsedClockSeconds(clock, now) >= HALF_SECONDS
}

export function addGoalState(sport, side, scorer) {
  if (side !== 'home' && side !== 'away') return sport
  return {
    ...sport,
    [side]: (Number(sport[side]) || 0) + 1,
    scorers: [...(sport.scorers || []), scorer],
  }
}

export function removeLatestGoalState(sport, side, teamId) {
  if (side !== 'home' && side !== 'away') return sport
  const scorers = sport.scorers || []
  const scorerIndex = scorers.findLastIndex((scorer) => scorer.teamId === teamId)
  return {
    ...sport,
    [side]: Math.max(0, (Number(sport[side]) || 0) - 1),
    scorers: scorerIndex < 0 ? scorers : scorers.filter((_, index) => index !== scorerIndex),
  }
}

// A scorekeeper may publish only after the referee has ended a complete
// second half: the clock must have reached ten minutes and be explicitly
// paused. The overrun remains visible until that pause, so the timer itself
// never decides when play ends.
export function canPublishSport(sport, now = Date.now(), options = {}) {
  const allowInstantPublish = options.allowInstantPublish ?? DEMO_INSTANT_PUBLISH_ENABLED
  if (allowInstantPublish && sport?.status === 'live') {
    return true
  }
  const clock = sport?.clock
  return sport?.status === 'live'
    && clock?.phase === 'h2'
    && !clock.runningSince
    && elapsedClockSeconds(clock, now) >= HALF_SECONDS
}

export function reopenSportState(sport) {
  return {
    ...sport,
    status: 'live',
    clock: sport.clock?.phase === 'ft'
      ? { ...sport.clock, phase: 'h2', runningSince: null }
      : sport.clock,
  }
}

// Sin-bin timers move in lockstep with the game clock (§2): paused when it
// pauses, resumed when it resumes — mirroring the game clock's own
// baseSeconds/runningSince split so a paused card simply stops accruing
// elapsed time instead of continuing to tick against the wall clock. They stay
// independent of the game clock's own phase/reset: resetClockState below
// deliberately never touches `cards`.
function pauseSinBinCards(cards, now) {
  return (cards || []).map((card) => {
    if (!card.sinBinRunningSince) return card
    const startedAt = Date.parse(card.sinBinRunningSince)
    const elapsed = Number.isFinite(startedAt) ? Math.max(0, (now - startedAt) / 1000) : 0
    return {
      ...card,
      sinBinBaseSeconds: (Number(card.sinBinBaseSeconds) || 0) + elapsed,
      sinBinRunningSince: null,
    }
  })
}

function resumeSinBinCards(cards, startedAt, now) {
  return (cards || []).map((card) => {
    if (card.sinBinRunningSince || !('sinBinBaseSeconds' in card)) return card
    if (sinBinRemainingSeconds(card, now) <= 0) return card
    return { ...card, sinBinRunningSince: startedAt }
  })
}

export function addSinBinCardState(sport, card, issuedAt = new Date().toISOString()) {
  const sinBinSeconds = CARD_SIN_BIN_SECONDS[card.type] || 0
  const gameRunning = Boolean(sport.clock?.runningSince)
  return {
    ...sport,
    cards: [
      ...(sport.cards || []),
      {
        ...card,
        issuedAt,
        sinBinSeconds,
        sinBinBaseSeconds: 0,
        sinBinRunningSince: gameRunning ? issuedAt : null,
      },
    ],
  }
}

export function sinBinRemainingSeconds(card, now = Date.now()) {
  const duration = Number(card?.sinBinSeconds) || CARD_SIN_BIN_SECONDS[card?.type] || 0
  if (!duration) return 0

  // Pause-aware shape (§2) — remaining derives from banked seconds plus the
  // current running segment, if any.
  if (card && 'sinBinBaseSeconds' in card) {
    const base = Number(card.sinBinBaseSeconds) || 0
    const startedAt = card.sinBinRunningSince ? Date.parse(card.sinBinRunningSince) : null
    const running = Number.isFinite(startedAt) ? Math.max(0, (now - startedAt) / 1000) : 0
    return Math.min(duration, Math.max(0, Math.ceil(duration - (base + running))))
  }

  // Legacy shape — continuous wall-clock countdown from issue time.
  const rawStartedAt = card?.sinBinStartedAt ?? card?.issuedAt
  const startedAt = typeof rawStartedAt === 'number' ? rawStartedAt : Date.parse(rawStartedAt)
  if (!Number.isFinite(startedAt)) return 0
  return Math.min(duration, Math.max(0, Math.ceil(duration - (now - startedAt) / 1000)))
}

// Resolves which teams play a given sport within a fixture slot (§8). Round-
// robin fixtures (m1-m6) always share one printed pairing at the fixture
// level. The playoff/final slots can seat different teams per sport once
// auto-populated, since soccer and netball run separate round-robin tables —
// so a per-sport pairing, when present, wins over the fixture-level one.
export function sportHomeAwayIds(fixture, sport) {
  return {
    homeTeamId: fixture?.[sport]?.homeTeamId ?? fixture?.homeTeamId ?? null,
    awayTeamId: fixture?.[sport]?.awayTeamId ?? fixture?.awayTeamId ?? null,
  }
}

// One headline pairing for UI that shows a single "who's playing" label per
// fixture slot (ticket headers, the MANCO report): the fixed fixture-level
// pairing when set (always true for round-robin), else whichever sport has
// auto-populated its own pairing first. Soccer and netball only ever diverge
// on the playoff/final slots; screens that need each sport's own authoritative
// pairing regardless of this headline should call sportHomeAwayIds directly.
export function headlinePairing(fixture) {
  if (fixture?.homeTeamId && fixture?.awayTeamId) {
    return { homeTeamId: fixture.homeTeamId, awayTeamId: fixture.awayTeamId }
  }
  for (const sport of ['soccer', 'netball']) {
    const ids = sportHomeAwayIds(fixture, sport)
    if (ids.homeTeamId && ids.awayTeamId) return ids
  }
  return { homeTeamId: null, awayTeamId: null }
}

// One fixture's overall status across both sports — live if either sport is
// live, final only once both are (a fixture isn't "done" until both legs
// are), else upcoming. Shared by the Fixtures ticket rail and the Schedule
// day rail so a published result strikes off the same fixture in both places.
export function fixtureOverallStatus(fixture) {
  if (fixture?.soccer?.status === 'live' || fixture?.netball?.status === 'live') return 'live'
  if (fixture?.soccer?.status === 'final' && fixture?.netball?.status === 'final') return 'final'
  return 'upcoming'
}

export function finalChampion(sport, fixtures = [], teams = []) {
  const final = fixtures.find((fixture) => fixture.round === 'final')
  const result = final?.[sport]
  if (!final || result?.status !== 'final') return null
  if (Number(result.home) === Number(result.away)) return null

  const { homeTeamId, awayTeamId } = sportHomeAwayIds(final, sport)
  const championId = Number(result.home) > Number(result.away) ? homeTeamId : awayTeamId
  const team = teams.find((candidate) => candidate.id === championId)
  return team ? { sport, team, fixtureId: final.id, score: { home: result.home, away: result.away } } : null
}

export function finalChampions(fixtures = [], teams = []) {
  return ['soccer', 'netball']
    .map((sport) => finalChampion(sport, fixtures, teams))
    .filter(Boolean)
}

export function formatDurationSeconds(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
