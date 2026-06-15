// Persistent bottom tab bar (§6 shared nav · §5.3 thumb zone).
const TABS = [
  { id: 'live', label: 'Live', glyph: '📡' },
  { id: 'fixtures', label: 'Fixtures', glyph: '🗒️' },
  { id: 'table', label: 'Table', glyph: '🏆' },
  { id: 'travel', label: 'Travel', glyph: '🚌' },
  { id: 'schedule', label: 'Schedule', glyph: '🕒' },
]

export default function BottomTabBar({ active, onChange }) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => (
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

export { TABS }
