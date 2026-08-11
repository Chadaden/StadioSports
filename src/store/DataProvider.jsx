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
  addDoc, collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db, EVENT_ID, isFirebaseConfigured } from '../firebase/config'
import { buildSeedSnapshot, MILESTONES, players as seedPlayers } from '../data/seed'
import {
  activateSportState,
  addGoalState,
  addSinBinCardState,
  adjustScoreState,
  attributeScorerState,
  canPublishSport,
  removeGoalState,
  removeLatestGoalState,
  reopenSportState,
  pauseClockState,
  resetClockState,
  resumeClockState,
  sportHomeAwayIds,
  startClockState,
  startSecondHalfState,
} from '../lib/matchState'
import { buildPublicationPatches } from '../lib/standings'
import { useRole } from './RoleContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { role, teamId: myTeamId } = useRole()
  const [snapshot, setSnapshot] = useState(() =>
    isFirebaseConfigured ? null : buildSeedSnapshot(),
  )
  const [loading, setLoading] = useState(isFirebaseConfigured)

  // Surfaced by any screen that renders scorekeeper controls (§SkControls) so
  // a failed write is never just a tap that silently did nothing — see
  // writeSport below, the one place all those writes funnel through.
  const [dataError, setDataError] = useState(null)

  // Manager-only private profiles (emergency contact / medical / dietary, §9).
  // Live: one listener on the manager's own team's `private` subcollection.
  // No public screen loads it; during the approved link-gated test this is UI
  // isolation only because Firestore does not yet have authenticated roles.
  // Demo: lazy-load the GIT-IGNORED local module (separate chunk, manager
  // role only) — the glob resolves to nothing when the file is absent, so a
  // fresh clone still builds and managers see "No private details on file".
  const [profiles, setProfiles] = useState({})
  const [profilesLoading, setProfilesLoading] = useState(
    isFirebaseConfigured && role === 'manager' && Boolean(myTeamId),
  )
  useEffect(() => {
    if (role !== 'manager' || !myTeamId) return
    if (isFirebaseConfigured) {
      const profilesRef = collection(db, 'events', EVENT_ID, 'teams', myTeamId, 'private')
      let alive = true
      const applyProfiles = (qs) => {
        if (!alive) return
        setProfiles(Object.fromEntries(qs.docs.map((d) => [d.id, d.data()])))
        setProfilesLoading(false)
      }
      const reportError = (error) => {
        if (!alive) return
        console.error('Unable to load private player profiles:', error)
        setProfilesLoading(false)
      }

      // Establish an explicit initial-read boundary before exposing player
      // cards, then keep the same collection live for any organiser updates.
      getDocs(profilesRef).then(applyProfiles, reportError)
      const unsubscribe = onSnapshot(profilesRef, applyProfiles, reportError)
      return () => {
        alive = false
        unsubscribe()
      }
    }
    const modules = import.meta.glob('../data/privateProfiles.local.js')
    const load = modules['../data/privateProfiles.local.js']
    if (!load) return
    let alive = true
    load().then((m) => {
      if (!alive) return
      setProfiles(m.playerProfiles)
      setProfilesLoading(false)
    })
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
    const ready = {
      event: false, teams: false, fixtures: false, travel: false, announcements: false,
    }
    const expectedPlayerTeams = new Set()
    const loadedPlayerTeams = new Set()
    let started = false
    const commit = () => {
      if (!started) return
      // Seed players stand in only while this team's own players listener
      // hasn't reported back yet, so goal attribution isn't stuck with an
      // empty picker during that load window. Once the listener has fired —
      // even with zero docs — that's Firestore's real answer, not a gap to
      // paper over: an empty live roster stays empty, so TeamScreen's
      // "Roster pending" check (players.length === 0) can still catch a
      // genuinely missing/unsubmitted roster instead of it silently reading
      // as confirmed seed data.
      const rosterForTeam = (teamId) => {
        if (expectedPlayerTeams.has(teamId) && !loadedPlayerTeams.has(teamId)) {
          return seedPlayers[teamId] || []
        }
        return next.players[teamId] || []
      }
      setSnapshot({
        event: next.event,
        teams: next.teams.map((t) => ({ ...t, players: rosterForTeam(t.id) })),
        fixtures: next.fixtures,
        travel: next.travel,
        announcements: next.announcements,
      })
      const coreReady = Object.values(ready).every(Boolean)
      const rostersReady = [...expectedPlayerTeams].every((id) => loadedPlayerTeams.has(id))
      setLoading(!(coreReady && rostersReady))
    }

    const unsubs = []
    unsubs.push(onSnapshot(base, (d) => {
      next.event = { id: d.id, ...d.data() }
      ready.event = true
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'teams')), (qs) => {
      next.teams = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
      ready.teams = true
      // Managers receive only their own roster. Team metadata stays available
      // for fixtures, standings and travel, but other campuses' player names
      // and attendance details never enter a manager session.
      next.teams.forEach((t) => {
        if (role === 'manager' && t.id !== myTeamId) return
        expectedPlayerTeams.add(t.id)
        if (next.players[t.id] !== undefined) return
        next.players[t.id] = []
        unsubs.push(onSnapshot(query(collection(base, 'teams', t.id, 'players')), (ps) => {
          next.players[t.id] = ps.docs.map((d) => ({ id: d.id, ...d.data() }))
          loadedPlayerTeams.add(t.id)
          commit()
        }))
      })
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'fixtures')), (qs) => {
      next.fixtures = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0))
      ready.fixtures = true
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'travel')), (qs) => {
      next.travel = Object.fromEntries(qs.docs.map((d) => [d.id, d.data()]))
      ready.travel = true
      commit()
    }))

    unsubs.push(onSnapshot(query(collection(base, 'announcements')), (qs) => {
      next.announcements = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      ready.announcements = true
      commit()
    }))

    started = true
    commit()
    return () => unsubs.forEach((u) => u())
  }, [role, myTeamId])

  // -------------------------------------------------------------------------
  // Write actions (Phase 2 Scorekeeper, §8). Each works in both modes:
  //   live  → write to Firestore; the onSnapshot listeners reflect it back
  //   demo  → mutate the local snapshot so the experience is fully testable.
  // During this approved test, role links gate the visible controls; real
  // database-level role enforcement still requires Firebase Auth.
  // -------------------------------------------------------------------------
  const actions = useMemo(() => {
    const fixtureRef = (id) => doc(db, 'events', EVENT_ID, 'fixtures', id)

    // Serialize a scorekeeper edit against the current fixture. A complete
    // sport object is stored on each write, so deriving it from a stale
    // browser snapshot could otherwise discard a quick second tap or
    // attribution.
    //
    // `transactional` opts into a Firestore transaction (an extra server
    // read + retry-on-conflict) for writes that mutate a shared list
    // (scorers/cards): two devices concurrently reading-then-writing that
    // same array can otherwise silently drop one write under a plain
    // updateDoc's last-write-wins semantics. Simple clock-phase transitions
    // (start/pause/resume/reset) don't share that risk — a lost update there
    // just means the next tap corrects it a moment later, same as if two
    // people pressed different buttons on a shared stopwatch — so they skip
    // the extra read/retry and write straight off this client's own
    // live-subscribed fixture.
    const writeSport = (fixtureId, sport, mutate, { transactional = false } = {}) => {
      const fx = (snapRef.current?.fixtures || []).find((f) => f.id === fixtureId)
      if (!fx) return
      const mutateSport = (fixture) => mutate({
        ...fixture[sport],
        scorers: [...(fixture[sport].scorers || [])],
        cards: [...(fixture[sport].cards || [])],
      }, fixture)
      if (isFirebaseConfigured) {
        // Every scorekeeper tap (pause/resume/goal/card/attribution/reset)
        // funnels through here, so one catch covers all of them — the same
        // silent-failure shape publishSport hit once already (see its own
        // comment below) instead of trusting every future call site to
        // remember its own try/catch.
        const reportFailure = (error) => {
          console.error(`Scorekeeper write failed (fixture ${fixtureId}, ${sport}):`, error)
          setDataError('That action failed to save — check your connection and try again.')
          throw error
        }
        if (!transactional) {
          return updateDoc(fixtureRef(fixtureId), { [sport]: mutateSport(fx) }).catch(reportFailure)
        }
        return runTransaction(db, async (transaction) => {
          const current = await transaction.get(fixtureRef(fixtureId))
          if (!current.exists()) return
          const fixture = { id: current.id, ...current.data() }
          transaction.update(fixtureRef(fixtureId), { [sport]: mutateSport(fixture) })
        }).catch(reportFailure)
      }
      const nextSport = mutateSport(fx)
      setSnapshot((prev) => ({
        ...prev,
        fixtures: prev.fixtures.map((f) => (f.id === fixtureId ? { ...f, [sport]: nextSport } : f)),
      }))
    }

    return {
      // Start the match without starting the independent match clock.
      startSport: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => activateSportState(s)),

      startClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => startClockState(s)),

      // Half-time / pause: bank the played seconds, stop ticking.
      pauseClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => pauseClockState(s)),

      // Start 2nd half / resume: clock ticks again from the banked seconds.
      resumeClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => resumeClockState(s)),

      startSecondHalf: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => startSecondHalfState(s)),

      resetClock: (fixtureId, sport) =>
        writeSport(fixtureId, sport, (s) => resetClockState(s)),

      // Goal: bumps the score AND logs the scorer (with the clock minute
      // captured in the UI at tap time) in one write — pushes to every
      // viewer. Transactional: a concurrent goal from another device must
      // never be lost off the end of scorers[].
      addGoal: (fixtureId, sport, side, scorer) =>
        writeSport(fixtureId, sport, (s) => addGoalState(s, side, scorer), { transactional: true }),

      // +/- score corrections (also marks an upcoming match live, clock
      // stopped). Transactional for the same lost-update risk as addGoal.
      adjustScore: (fixtureId, sport, side, delta) =>
        writeSport(fixtureId, sport, (s) => adjustScoreState(s, side, delta), { transactional: true }),

      // Undo a mis-tapped goal: drops the scorer entry AND the point in the
      // same write (two separate writes could race each other on stale
      // state). Keyed by the scorer's stable id, not the array index it had
      // on this device's screen — see removeGoalState for why. Transactional
      // for the same reason as addGoal.
      removeGoal: (fixtureId, sport, scorerId) =>
        writeSport(fixtureId, sport, (s, fx) => {
          const { awayTeamId } = sportHomeAwayIds(fx, sport)
          return removeGoalState(s, scorerId, awayTeamId)
        }, { transactional: true }),

      removeLatestGoal: (fixtureId, sport, side) =>
        writeSport(fixtureId, sport, (s, fx) => {
          const { homeTeamId, awayTeamId } = sportHomeAwayIds(fx, sport)
          return removeLatestGoalState(s, side, side === 'away' ? awayTeamId : homeTeamId)
        }, { transactional: true }),

      addScorer: (fixtureId, sport, scorer) =>
        writeSport(fixtureId, sport, (s) => ({ ...s, scorers: [...s.scorers, scorer] }), { transactional: true }),

      // Deferred attribution (§5): fills in the name/playerId on one already-
      // logged (possibly "unknown") scorers[] entry, keyed by its stable id.
      // Never touches the score. Transactional so a concurrent goal add/
      // remove on the same array can't make this edit the wrong entry.
      attributeScorer: (fixtureId, sport, scorerId, attribution) =>
        writeSport(fixtureId, sport, (s) => attributeScorerState(s, scorerId, attribution), { transactional: true }),

      addCard: (fixtureId, sport, card) =>
        writeSport(fixtureId, sport, (s) => addSinBinCardState(s, card), { transactional: true }),

      // Publish (live → final, locks, clock stops). Live mode reads every
      // fixture inside one transaction so concurrent final round-robin
      // publications retry against a consistent standings table.
      //
      // Transaction.get() only supports individual DocumentReferences, not a
      // collection Query — passing a Query throws inside the SDK's internal
      // read-set bookkeeping (TypeError reading 'path' on undefined), and
      // since the write action was never awaited/caught anywhere, that threw
      // promise silently vanished: the button looked clicked and nothing
      // published. Read each known fixture id individually instead.
      publishSport: (fixtureId, sport) => {
        if (isFirebaseConfigured) {
          const fixtureIds = Array.from(new Set([
            fixtureId, ...(snapRef.current?.fixtures || []).map((f) => f.id),
          ]))
          return runTransaction(db, async (transaction) => {
            const docs = await Promise.all(fixtureIds.map((id) => transaction.get(fixtureRef(id))))
            const fixtures = docs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }))
            const fixture = fixtures.find((f) => f.id === fixtureId)
            if (!fixture || !canPublishSport(fixture[sport])) return
            const patches = buildPublicationPatches(
              fixtureId, sport, fixtures, snapRef.current?.teams || [], snapRef.current?.event,
            )
            if (!patches) return
            for (const { id, patch } of patches) transaction.update(fixtureRef(id), { [sport]: patch })
          })
        }

        const fixtures = snapRef.current?.fixtures || []
        const fixture = fixtures.find((f) => f.id === fixtureId)
        if (!fixture || !canPublishSport(fixture[sport])) return
        const patches = buildPublicationPatches(
          fixtureId, sport, fixtures, snapRef.current?.teams || [], snapRef.current?.event,
        )
        if (!patches) return

        setSnapshot((prev) => ({
          ...prev,
          fixtures: prev.fixtures.map((f) => {
            const found = patches.find((p) => p.id === f.id)
            return found ? { ...f, [sport]: found.patch } : f
          }),
        }))
      },

      reopenSport: (fixtureId, sport) =>
        writeSport(fixtureId, sport, reopenSportState),

      clearDataError: () => setDataError(null),

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
    () => ({
      ...(snapshot || {}), profiles, loading: loading || profilesLoading,
      isLive: isFirebaseConfigured, actions, dataError,
    }),
    [snapshot, profiles, loading, profilesLoading, actions, dataError],
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
