import { useRole } from '../store/RoleContext'

// Persistent bottom tab bar (§5.3 thumb zone).
// Travel is a team-manager tab only — hidden from the public Viewer (§3) and,
// per client request (14 Jul), from the Scorekeeper too (not relevant on the day).
const ALL_TABS = [
  { id: 'live', label: 'Live', glyph: '📡' },
  { id: 'fixtures', label: 'Fixtures', glyph: '🗒️' },
  { id: 'table', label: 'Table', glyph: '🏆' },
  { id: 'travel', label: 'Travel', glyph: '🚌', managerOnly: true },
  { id: 'schedule', label: 'Schedule', glyph: '🕒' },
]

export default function BottomTabBar({ active, onChange }) {
  const { role } = useRole()
  const isManager = role === 'manager'
  const tabs = ALL_TABS.filter((t) => !t.managerOnly || isManager)

  return (
    <nav className="tabbar" aria-label="Primary" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'active' : ''}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="glyph" aria-hidden="true">{t.glyph}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}

export { ALL_TABS }
