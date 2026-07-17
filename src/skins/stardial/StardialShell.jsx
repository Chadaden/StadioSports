// Stardial shell — the alternate presentation layer. Mounted by App.jsx's
// Shell when the Stardial skin is active; classic Shell renders otherwise and
// is never modified. Tab state, role rules and data flow are shared with
// classic (ALL_TABS is imported from the classic tab bar so the two skins can
// never disagree about who sees which tab).
//
// Live / Fixtures / Table / Schedule are fully rebuilt Stardial screens.
// Team & Travel (manager-only) reuse the classic screens inside this shell —
// same features, consistent frame.

import { useRole } from '../../store/RoleContext'
import { useData } from '../../store/DataProvider'
import { ALL_TABS } from '../../components/BottomTabBar'
import TeamScreen from '../../screens/TeamScreen'
import TravelScreen from '../../screens/TravelScreen'
import Icon from './icons'
import { ModeChip } from './bits'
import SdLiveScreen from './LiveScreen'
import SdFixturesScreen from './FixturesScreen'
import SdTableScreen from './TableScreen'
import SdScheduleScreen from './ScheduleScreen'

const TAB_ICON = {
  live: 'live', team: 'team', fixtures: 'fixtures',
  table: 'table', travel: 'travel', schedule: 'schedule',
}

const TAB_TITLE = {
  live: 'Live', team: 'My Team', fixtures: 'Fixtures',
  table: 'Standings', travel: 'Travel', schedule: 'The Day',
}

export default function StardialShell({ tab, onTab, contentRef, loading }) {
  const { isLive } = useData()

  if (loading) {
    return (
      <div className="sd-app">
        <div className="sd-loading">
          <Icon name="live" size={30} />
          <b>Loading live data…</b>
        </div>
      </div>
    )
  }

  return (
    <div className="sd-app">
      <div className="sd-scroll" ref={contentRef}>
        {tab === 'live' ? (
          <SdLiveScreen />
        ) : (
          <>
            <header className="sd-header">
              <div className="sd-hero-bar">
                <span className="sd-kicker">STADIO · SPORTS DAY 2026</span>
                <ModeChip isLive={isLive} />
              </div>
              <h1 className="sd-title">{TAB_TITLE[tab] || tab}</h1>
            </header>
            <div className="sd-sheet sd-sheet-page">
              {tab === 'team' && <TeamScreen />}
              {tab === 'fixtures' && <SdFixturesScreen />}
              {tab === 'table' && <SdTableScreen />}
              {tab === 'travel' && <TravelScreen />}
              {tab === 'schedule' && <SdScheduleScreen />}
            </div>
          </>
        )}
      </div>
      <SdTabBar active={tab} onChange={onTab} />
    </div>
  )
}

function SdTabBar({ active, onChange }) {
  const { role } = useRole()
  const isManager = role === 'manager'
  const tabs = ALL_TABS.filter((t) => {
    if (t.managerOnly) return isManager
    if (t.hideForManager) return !isManager
    return true
  })

  return (
    <nav className="sd-tabbar" aria-label="Primary" style={{ '--tabs': tabs.length }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'active' : ''}
          aria-current={active === t.id ? 'page' : undefined}
          style={{ '--tab-accent': t.accent }}
          onClick={() => onChange(t.id)}
        >
          <span className="sd-tab-ic"><Icon name={TAB_ICON[t.id] || 'live'} size={21} /></span>
          <span className="sd-tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
