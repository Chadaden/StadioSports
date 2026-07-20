import { useEffect, useRef, useState } from 'react'
import './App.css'
import { DataProvider, useData } from './store/DataProvider'
import { RoleProvider, useRole } from './store/RoleContext'
import StardialShell from './skins/stardial/StardialShell'

// Phase 1 — the public Viewer. Three-role architecture (§3) is resolved in
// lib/roles.js; Scorekeeper (Phase 2) and Manager (Phase 3) layer their write
// controls onto these same screens later. The Viewer shows zero organiser UI.
function Shell() {
  const { loading } = useData()
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

  // UX law §5.1 — every tab lands scrolled to top.
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [tab])

  return <StardialShell tab={tab} onTab={setTab} contentRef={contentRef} loading={loading} />
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
