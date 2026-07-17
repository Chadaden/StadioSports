// Match clock (§8 scorekeeper timer). Tournament format from the sheet:
// 20 minutes total — 2 × 10-minute halves with a 5-minute halftime.
//
// Stored per sport on the fixture as:
//   clock: { phase, runningSince, baseSeconds }
//     phase        'h1' | 'ht' | 'h2' | 'paused' | 'ft'
//     runningSince ISO timestamp while ticking, null while stopped
//     baseSeconds  playing seconds accumulated before runningSince
//
// Elapsed time is derived, never ticked in the database — one write at each
// whistle, every device computes the same minute from its own clock.

import { useEffect, useRef, useState } from 'react'
import {
  elapsedClockSeconds,
  formatDurationSeconds,
  shouldAlertFirstHalfEnd,
} from './matchState'

export const PHASE_LABELS = {
  h1: '1st half',
  ht: 'Half-time',
  h2: '2nd half',
  paused: 'Paused',
  ft: 'Full-time',
}

export function isClockRunning(clock) {
  return Boolean(clock?.runningSince)
}

export function elapsedSeconds(clock, now = Date.now()) {
  return elapsedClockSeconds(clock, now)
}

// Football-style minute: 0:00–0:59 is the 1st minute.
export function clockMinute(clock, now = Date.now()) {
  return Math.floor(elapsedSeconds(clock, now) / 60) + 1
}

export function formatClock(clock, now = Date.now()) {
  return formatDurationSeconds(elapsedSeconds(clock, now))
}

export function useSecondTick(active) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    const first = setTimeout(() => setNow(Date.now()), 0)
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearTimeout(first); clearInterval(id) }
  }, [active])
  return now
}

// Re-render every second while any provided clock is running, returning a
// fresh timestamp to derive the display from. Returns 0 until the first tick
// (elapsedSeconds treats that as "just started" — off by under a second).
export function useClockTick(...clocks) {
  const running = clocks.some((c) => isClockRunning(c))
  return useSecondTick(running)
}

// Browser alert is deliberately local-only: it warns the active scorekeeper
// once and never creates per-second database writes or spectator pop-ups.
export function useFirstHalfAlert(clock, now) {
  const alerted = useRef(false)
  const reached = shouldAlertFirstHalfEnd(clock, now)
  useEffect(() => {
    if (clock?.phase !== 'h1' || elapsedSeconds(clock, now) < 1) alerted.current = false
    if (!reached || alerted.current) return
    alerted.current = true
    window.alert('First half has reached 10:00. Pause the timer when the half ends.')
  }, [clock, now, reached])
  return reached
}
