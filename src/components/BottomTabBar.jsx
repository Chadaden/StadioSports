import { useRole } from '../store/RoleContext'

// Persistent bottom tab bar (§5.3 thumb zone).
// Travel is a team-manager tab only — hidden from the public Viewer (§3) and,
// per client request (14 Jul), from the Scorekeeper too (not relevant on the day).
// Each tab carries its own accent colour (STADIO spectrum) so the active
// state reads instantly instead of everything defaulting to the same blue.
const ALL_TABS = [
  { id: 'live', label: 'Live', glyph: '📡', accent: 'var(--red)' },
  { id: 'fixtures', label: 'Fixtures', glyph: '🗒️', accent: 'var(--sky)' },
  { id: 'table', label: 'Table', glyph: '🏆', accent: 'var(--orange)' },
  { id: 'travel', label: 'Travel', glyph: '🚌', accent: 'var(--teal)', managerOnly: true },
  { id: 'schedule', label: 'Schedule', glyph: '🕒', accent: 'var(--purple)' },
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
          style={{ '--tab-accent': t.accent }}
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
