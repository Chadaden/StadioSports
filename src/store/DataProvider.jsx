/* eslint-disable react-refresh/only-export-components */
// Single data layer for the whole app.
//
// LIVE MODE  (Firebase configured): real-time onSnapshot listeners drive every
//            screen — UX law §5.5 "live by default", no manual refresh.
// DEMO MODE  (no creds): serves the bundled seed snapshot so the Viewer is
//            fully usable with no backend. Identical shape to live mode, so
//            screens never branch on which mode they're in.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, query } from 'firebase/firestore'
import { db, EVENT_ID, isFirebaseConfigured } from '../firebase/config'
import { buildSeedSnapshot } from '../data/seed'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [snapshot, setSnapshot] = useState(() =>
    isFirebaseConfigured ? null : buildSeedSnapshot(),
  )
  const [loading, setLoading] = useState(isFirebaseConfigured)

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

  const value = useMemo(
    () => ({ ...(snapshot || {}), loading, isLive: isFirebaseConfigured }),
    [snapshot, loading],
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
