// Small shared presentational components (build spec §4, §6).

export function SpectrumBar() {
  return (
    <div className="spectrum" role="presentation" aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i /><i />
    </div>
  )
}

// Team crest: a rounded chip in the team's spectrum colour with its 3-letter code.
export function Crest({ team, size }) {
  if (!team) {
    return <span className={`crest${size ? ' ' + size : ''}`} style={{ background: 'var(--grey)' }}>—</span>
  }
  return (
    <span
      className={`crest${size ? ' ' + size : ''}`}
      style={{ background: team.colorHex }}
      title={team.name}
    >
      {team.code}
    </span>
  )
}

export function LiveBadge() {
  return (
    <span className="badge-live"><span className="pulse" />Live</span>
  )
}

// Status chip per match state.
export function StatusChip({ status }) {
  if (status === 'live') return <LiveBadge />
  if (status === 'final') return <span className="chip chip-final">Full-time</span>
  return <span className="chip chip-upcoming">Upcoming</span>
}

export function EmptyState({ glyph = '🗓️', title, sub }) {
  return (
    <div className="empty">
      <div className="e-glyph">{glyph}</div>
      <div className="e-title">{title}</div>
      {sub && <div className="e-sub">{sub}</div>}
    </div>
  )
}

export function SectionLabel({ children }) {
  return <div className="kicker section-label">{children}</div>
}
