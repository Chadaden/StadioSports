// Match clock helpers (§8 scorekeeper timer — client request, 14 Jul email).
// A sport's `clock` is a continuously-counting stopwatch (not a countdown):
// { half: 1|2, running: bool, halftime: bool, startedAt: ms|null, accumulatedMs: ms }
// elapsed = accumulatedMs + (running ? now - startedAt : 0)

import { useEffect, useState } from 'react'

export const HALF_MINUTES = 10
export const HALFTIME_MINUTES = 5

// Sin-bin countdown durations per card colour (client: 2 min yellow, 10 min red).
export const CARD_SIN_BIN_MS = { yellow: 2 * 60 * 1000, red: 10 * 60 * 1000 }

export function freshClock() {
  return { half: 1, running: true, halftime: false, startedAt: Date.now(), accumulatedMs: 0 }
}

export function clockElapsedMs(clock, now = Date.now()) {
  if (!clock) return 0
  const running = clock.running && typeof clock.startedAt === 'number'
  return (clock.accumulatedMs || 0) + (running ? Math.max(0, now - clock.startedAt) : 0)
}

export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Human phase label + which control(s) to offer.
export function matchPhase(clock, locked) {
  if (locked) return 'full_time'
  if (!clock) return 'not_started'
  if (clock.halftime) return 'halftime'
  if (clock.running) return clock.half === 2 ? 'second_half' : 'first_half'
  return clock.accumulatedMs > 0 || clock.half === 2 ? 'paused' : 'not_started'
}

export function cardRemainingMs(card, now = Date.now()) {
  const total = CARD_SIN_BIN_MS[card.type]
  if (!total || !card.issuedAt) return 0
  return Math.max(0, total - (now - card.issuedAt))
}

// Ticks once a second while `active`; still, cheap when idle.
export function useNow(active, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
  return now
}
