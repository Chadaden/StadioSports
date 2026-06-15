import { useEffect, useRef, useState } from 'react'
import './App.css'
import { DataProvider, useData } from './store/DataProvider'
import AppHeader from './components/AppHeader'
import BottomTabBar from './components/BottomTabBar'
import LiveScreen from './screens/LiveScreen'
import FixturesScreen from './screens/FixturesScreen'
import TableScreen from './screens/TableScreen'
import TravelScreen from './screens/TravelScreen'
import ScheduleScreen from './screens/ScheduleScreen'
import SquadsScreen from './screens/SquadsScreen'

// Phase 1 — the public Viewer. Three-role architecture (§3) is resolved in
// lib/roles.js; Scorekeeper (Phase 2) and Manager (Phase 3) layer their write
// controls onto these same screens later. The Viewer shows zero organiser UI.
function Shell() {
  const { loading, isLive } = useData()
  // 'squads' is a sub-view reached from Live, not a bottom tab (§6).
  const [tab, setTab] = useState('live')
  const contentRef = useRef(null)

  // UX law §5.1 — every tab lands scrolled to top.
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [tab])

  if (loading) {
    return (
      <div className="app">
        <AppHeader />
        <div className="content"><div className="empty"><div className="e-glyph">⏳</div><div className="e-title">Loading live data…</div></div></div>
      </div>
    )
  }

  return (
    <div className="app">
      <AppHeader />
      {!isLive && (
        <div className="demo-banner">
          Demo data · connect Firebase to go live
        </div>
      )}
      <main className="content" ref={contentRef}>
        {tab === 'live' && <LiveScreen onOpenSquads={() => setTab('squads')} />}
        {tab === 'fixtures' && <FixturesScreen />}
        {tab === 'table' && <TableScreen />}
        {tab === 'travel' && <TravelScreen />}
        {tab === 'schedule' && <ScheduleScreen />}
        {tab === 'squads' && <SquadsScreen onBack={() => setTab('live')} />}
      </main>
      <BottomTabBar
        active={tab === 'squads' ? 'live' : tab}
        onChange={setTab}
      />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
