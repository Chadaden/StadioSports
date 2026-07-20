import { useRole } from '../store/RoleContext'

// Persistent bottom tab bar (§5.3 thumb zone).
// Team Manager's first tab is Team (their own roster as player cards), not
// Live — Live is a spectator concern. Travel is a team-manager tab only —
// hidden from the public Viewer (§3) and, per client request (14 Jul), from
// the Scorekeeper too (not relevant on the day).
// Each tab carries its own accent colour (STADIO spectrum) so the active
// state reads instantly instead of everything defaulting to the same blue.
const ALL_TABS = [
  { id: 'live', label: 'Live', accent: 'var(--red)', hideForManager: true },
  { id: 'team', label: 'Team', accent: 'var(--red)', managerOnly: true },
  { id: 'fixtures', label: 'Fixtures', accent: 'var(--sky)' },
  { id: 'table', label: 'Table', accent: 'var(--orange)' },
  { id: 'travel', label: 'Travel', accent: 'var(--teal)', managerOnly: true },
  { id: 'schedule', label: 'Schedule', accent: 'var(--purple)' },
]

export default function BottomTabBar({ active, onChange }) {
  const { role } = useRole()
  const isManager = role === 'manager'
  const tabs = ALL_TABS.filter((t) => {
    if (t.managerOnly) return isManager
    if (t.hideForManager) return !isManager
    return true
  })

  return (
    <nav className="tabbar" aria-label="Primary" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'active' : ''}
          aria-current={active === t.id ? 'page' : undefined}
          style={{ '--tab-accent': t.accent }}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}

export { ALL_TABS }
