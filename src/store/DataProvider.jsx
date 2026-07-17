/* eslint-disable react-refresh/only-export-components */
// Single data layer for the whole app.
//
// LIVE MODE  (Firebase configured): real-time onSnapshot listeners drive every
//            screen — UX law §5.5 "live by default", no manual refresh.
// DEMO MODE  (no creds): serves the bundled seed snapshot so the Viewer is
//            fully usable with no backend. Identical shape to live mode, so
//            screens never branch on which mode they're in.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db, EVENT_ID, isFirebaseConfigured } from '../firebase/config'
import { buildSeedSnapshot, MILESTONES } from '../data/seed'
import { elapsedSeconds } from '../lib/clock'
import {
  activateSportState,
  addSinBinCardState,
  adjustScoreState,
  pauseClockState,
  resetClockState,
  resumeClockState,
  startClockState,
  startSecondHalfState,
} from '../lib/matchState'
import { useRole } from './RoleContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { role, teamId: myTeamId } = useRole()
  const [snapshot, setSnapshot] = useState(() =>
    isFirebaseConfigured ? null : buildSeedSnapshot(),
  )
  const [loading, setLoading] = useState(isFirebaseConfigured)

  // Manager-only private profiles (emergency contact / medical / dietary, §9).
  // Live: one listener on the manager's own team's `private` subcollection —
  // security rules deny it to everyone else, and no public screen ever loads
  // it. Demo: lazy-load the GIT-IGNORED local module (separate chunk, manager
  // role only) — the glob resolves to nothing when the file is absent, so a
  // fresh clone still builds and managers see "No private details on file".
  const [profiles, setProfiles] = useState({})
  useEffect(() => {
    if (role !== 'manager' || !myTeamId) return
    if (isFirebaseConfigured) {
      return onSnapshot(
        collection(db, 'events', EVENT_ID, 'teams', myTeamId, 'private'),
        (qs) => setProfiles(Object.fromEntries(qs.docs.map((d) => [d.id, d.data()]))),
      )
    }
    const modules = import.meta.glob('../data/privateProfiles.local.js')
    const load = modules['../data/privateProfiles.local.js']
    if (!load) return
    let alive = true
    load().then((m) => { if (alive) setProfiles(m.playerProfiles) })
    return () => { alive = false }
  }, [role, myTeamId])

  // Latest snapshot kept in a ref so write actions read fresh state without
  // recreating their closures on every render.
  const snapRef = useRef(snapshot)
  useEffect(() => { snapRef.current = snapshot }, [snapshot])

  useEffect(() => {
    if (!isFirebaseConfigured) return // demo mode: static snapshot, nothing to subscribe

    const base = doc(db, 'events', EVENT_ID)
    const next = {
      event: null, teams: [], players: {}, fixtures: [], travel: {}, announcements: [],
    }
    let started = false
    const commit = () => {
      if (!started) return
      setSnapshot({
        event: next.event,
        teams: next.teams.map((t) => ({ ...t, players: next.players[t.id] || [] })),
        fixtures: next.fixtures,
        travel: next.travel,
        announcements: next.announcements,
      })
      setLoading(false)
    }

    const unsubs = []
    unsubs.push(onSnapshot(base, (d) => { next.event = { id: d.id, ...d.data() }; commit() }))

    unsubs.push(onSnapshot(query(collection(base, 'teams')), (qs) => {
      next.teams = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
      // subscribe to each team's players lazily on first sight
      next.teams.forEach((t) => {
        if (next.players[t.id] !== undefined) return
        next.players[t.id] = []
        unsubs.push(onSnapshot(query(collection(base, 'teams', t.id, 'players')), (ps) => {
          next.players[t.id] = ps.docs.map((d) => ({ id: d.id, ...d.data() }))
          commit()
        }))
      })
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'fixtures')), (qs) => {
      next.fixtures = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0))
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'travel')), (qs) => {
      next.travel = Object.fromEntries(qs.docs.map((d) => [d.id, d.data()]))
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'announcements')), (qs) => {
      next.announcements = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      commit()
    }))

    started = true
    commit()
    return () => unsubs.forEach((u) => u())
  }, [])

  // -------------------------------------------------------------------------
  // Write actions (Phase 2 Scorekeeper, §8). Each works in both modes:
  //   live  → write to Firestore; the onSnapshot listeners reflect it back
  //   demo  → mutate the local snapshot so the experience is fully testable.
  // Security rules (§3) enforce who may call these in live mode; the link
  // gates it in demo mode (§7 MVP shortcut).
  // -------------------------------------------------------------------------
  const actions = useMemo(() => {
    const fixtureRef = (id) => doc(db, 'events', EVENT_ID, 'fixtures', id)

    // Compute the new sport object from current state, then persist whole field.
    const writeSport = (fixtureId, sport, mutate) => {
      const fx = (snapRef.current?.fixtures || []).find((f) => f.id === fixtureId)
      if (!fx) return
      const nextSport = mutate({ ...fx[sport], scorers: [...(fx[sport].scorers || [])], cards: [...(fx[sport].cards || [])] })
      if (isFirebaseConfigured) {
        return updateDoc(fixtureRef(fixtureId), { [sport]: nextSport })
      }
      setSnapshot((prev) => ({
        ...prev,
        fixtures: prev.fixtures.map((f) => (f.id === fixtureId ? { ...f, [sport]: nextSport } : f)),
      }))
    }

    return {
      // Open the controls without starting the match clock.
      startSport: (fixtureId, sport) =>
        writeSport(fixtureId, sport, activateSportState),

      startClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, startClockState),

      // Half-time / pause: bank the played seconds, stop ticking.
      pauseClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, pauseClockState),

      // Start 2nd half / resume: clock ticks again from the banked seconds.
      resumeClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, resumeClockState),

      startSecondHalf: (fixtureId, sport) =>
        writeSport(fixtureId, sport, startSecondHalfState),

      resetClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, resetClockState),

      // Goal: bumps the score AND logs the scorer (with the clock minute
      // captured in the UI at tap time) in one write — pushes to every viewer.
      addGoal: (fixtureId, sport, side, scorer) =>
        writeSport(fixtureId, sport, (s) => ({
          ...s,
          [side]: (s[side] || 0) + 1,
          scorers: [...s.scorers, scorer],
        })),

      // +/- score corrections (also auto-starts an upcoming match on first tap)
      adjustScore: (fixtureId, sport, side, delta) =>
        writeSport(fixtureId, sport, (s) => adjustScoreState(s, side, delta)),

      // Undo a mis-tapped goal: drops the scorer entry AND the point in the
      // same write (two separate writes could race each other on stale state).
      removeGoal: (fixtureId, sport, index) =>
        writeSport(fixtureId, sport, (s) => {
          const entry = s.scorers[index]
          if (!entry) return s
          const fx = (snapRef.current?.fixtures || []).find((f) => f.id === fixtureId)
          const side = entry.teamId === fx?.awayTeamId ? 'away' : 'home'
          return {
            ...s,
            [side]: Math.max(0, (s[side] || 0) - 1),
            scorers: s.scorers.filter((_, i) => i !== index),
          }
        }),

      addScorer: (fixtureId, sport, scorer) =>
        writeSport(fixtureId, sport, (s) => ({ ...s, scorers: [...s.scorers, scorer] })),

      addCard: (fixtureId, sport, card) =>
        writeSport(fixtureId, sport, (s) => addSinBinCardState(s, card)),

      // publish (live → final, locks, clock stops) / reopen (final → live)
      publishSport: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => ({
          ...s,
          status: 'final',
          clock: s.clock
            ? { phase: 'ft', runningSince: null, baseSeconds: Math.round(elapsedSeconds(s.clock)) }
            : null,
        })),
      reopenSport: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => ({ ...s, status: 'live' })),

      // ---- Phase 3: Team Manager actions (§3, §6) -------------------------
      // Scoped strictly to the manager's own teamId in both live and demo mode.

      // Toggle one player present/absent
      togglePresent: (teamId, playerId, current) => {
        if (isFirebaseConfigured) {
          return updateDoc(
            doc(db, 'events', EVENT_ID, 'teams', teamId, 'players', playerId),
            { present: !current },
          )
        }
        setSnapshot((prev) => ({
          ...prev,
          teams: prev.teams.map((t) =>
            t.id !== teamId ? t : {
              ...t,
              players: t.players.map((p) =>
                p.id !== playerId ? p : { ...p, present: !current },
              ),
            },
          ),
        }))
      },

      // Mark all players on a team present at once (§5.4 one-tap shortcut)
      markAllPresent: (teamId) => {
        if (isFirebaseConfigured) {
          const batch = writeBatch(db)
          const tSnap = (snapRef.current?.teams || []).find((t) => t.id === teamId)
          for (const p of tSnap?.players || []) {
            batch.update(
              doc(db, 'events', EVENT_ID, 'teams', teamId, 'players', p.id),
              { present: true },
            )
          }
          // Also update attendance summary on travel doc
          batch.update(
            doc(db, 'events', EVENT_ID, 'travel', teamId),
            { 'attendance.present': (tSnap?.players || []).length, 'attendance.markedAllAt': serverTimestamp() },
          )
          return batch.commit()
        }
        setSnapshot((prev) => {
          const team = prev.teams.find((t) => t.id === teamId)
          const total = team?.players?.length || 0
          return {
            ...prev,
            teams: prev.teams.map((t) =>
              t.id !== teamId ? t : {
                ...t,
                players: t.players.map((p) => ({ ...p, present: true })),
              },
            ),
            travel: {
              ...prev.travel,
              [teamId]: {
                ...prev.travel[teamId],
                attendance: { present: total, total, markedAllAt: new Date().toISOString() },
              },
            },
          }
        })
      },

      // Advance the travel milestone one step (§6 milestone rail)
      advanceMilestone: (teamId) => {
        const cur = snapRef.current?.travel?.[teamId]?.milestone
        const idx = MILESTONES.indexOf(cur)
        const next = idx < MILESTONES.length - 1 ? MILESTONES[idx + 1] : cur
        const arrived = next === 'arrived'
        const update = {
          milestone: next,
          status: arrived ? 'checked_in' : 'in_transit',
          updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
        }
        if (isFirebaseConfigured) {
          return updateDoc(doc(db, 'events', EVENT_ID, 'travel', teamId), update)
        }
        setSnapshot((prev) => ({
          ...prev,
          travel: {
            ...prev.travel,
            [teamId]: { ...prev.travel[teamId], ...update },
          },
        }))
      },

      postAnnouncement: (body) => {
        const text = body.trim()
        if (!text) return
        if (isFirebaseConfigured) {
          return addDoc(collection(db, 'events', EVENT_ID, 'announcements'), {
            body: text, createdAt: serverTimestamp(),
          })
        }
        setSnapshot((prev) => ({
          ...prev,
          announcements: [
            { id: `a-${Date.now()}`, body: text, createdAt: new Date().toISOString() },
            ...prev.announcements,
          ],
        }))
      },
    }
  }, [])

  const value = useMemo(
    () => ({ ...(snapshot || {}), profiles, loading, isLive: isFirebaseConfigured, actions }),
    [snapshot, profiles, loading, actions],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within <DataProvider>')
  return ctx
}

// Small selector helpers used across screens.
export function useTeamMap() {
  const { teams = [] } = useData()
  return useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams])
}
