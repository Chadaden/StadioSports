import { useRole } from '../store/RoleContext'

// Persistent bottom tab bar (§5.3 thumb zone).
// Travel is an organiser tab — hidden from the public Viewer (§3).
const ALL_TABS = [
  { id: 'live', label: 'Live', glyph: '📡' },
  { id: 'fixtures', label: 'Fixtures', glyph: '🗒️' },
  { id: 'table', label: 'Table', glyph: '🏆' },
  { id: 'travel', label: 'Travel', glyph: '🚌', organiserOnly: true },
  { id: 'schedule', label: 'Schedule', glyph: '🕒' },
]

export default function BottomTabBar({ active, onChange }) {
  const { role } = useRole()
  const isOrganiser = role === 'scorekeeper' || role === 'manager'
  const tabs = ALL_TABS.filter((t) => !t.organiserOnly || isOrganiser)

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
