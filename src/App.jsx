import { useEffect, useRef, useState } from 'react'
import './App.css'
import { DataProvider, useData } from './store/DataProvider'
import { RoleProvider, useRole } from './store/RoleContext'
import { useSkin } from './skins/SkinContext'
import StardialShell from './skins/stardial/StardialShell'
import AppHeader from './components/AppHeader'
import BottomTabBar from './components/BottomTabBar'
import LiveScreen from './screens/LiveScreen'
import TeamScreen from './screens/TeamScreen'
import FixturesScreen from './screens/FixturesScreen'
import TableScreen from './screens/TableScreen'
import TravelScreen from './screens/TravelScreen'
import ScheduleScreen from './screens/ScheduleScreen'

// Phase 1 — the public Viewer. Three-role architecture (§3) is resolved in
// lib/roles.js; Scorekeeper (Phase 2) and Manager (Phase 3) layer their write
// controls onto these same screens later. The Viewer shows zero organiser UI.
function Shell() {
  const { loading, isLive } = useData()
  const { role } = useRole()
  // Each role lands on its most useful tab (§3, §6): Scorekeeper on Fixtures
  // (where scoring happens), Manager on Team (their own roster), everyone
  // else on Live.
  const [tab, setTab] = useState(() => {
    if (role === 'scorekeeper') return 'fixtures'
    if (role === 'manager') return 'team'
    return 'live'
  })
  const contentRef = useRef(null)
  const { skin } = useSkin()

  // UX law §5.1 — every tab lands scrolled to top.
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [tab])

  // Stardial skin: alternate presentation layer, same tab state, same data.
  // Classic below stays exactly as it always was.
  if (skin === 'stardial') {
    return <StardialShell tab={tab} onTab={setTab} contentRef={contentRef} loading={loading} />
  }

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
        {tab === 'live' && <LiveScreen />}
        {tab === 'team' && <TeamScreen />}
        {tab === 'fixtures' && <FixturesScreen />}
        {tab === 'table' && <TableScreen />}
        {tab === 'travel' && <TravelScreen />}
        {tab === 'schedule' && <ScheduleScreen />}
      </main>
      <BottomTabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </RoleProvider>
  )
}
