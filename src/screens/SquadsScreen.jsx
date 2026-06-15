import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { Crest, EmptyState } from '../components/ui'

// SQUADS (§6, reached from Live): tabs per team, players listed by sport with
// role tags. Names / sport / role only — no PII (§7, §9). Teams without a
// roster show a clean "Roster pending" empty state.
export default function SquadsScreen({ onBack }) {
  const { teams = [] } = useData()
  const [active, setActive] = useState(teams[0]?.id)
  const team = teams.find((t) => t.id === active) || teams[0]

  return (
    <>
      <button className="chip" onClick={onBack} style={{ marginBottom: 12, cursor: 'pointer' }}>‹ Back to Live</button>

      <div className="segmented" style={{ flexWrap: 'wrap' }}>
        {teams.map((t) => (
          <button key={t.id} className={t.id === active ? 'active' : ''} onClick={() => setActive(t.id)}>
            {t.code}
          </button>
        ))}
      </div>

      {team && <SquadList team={team} />}
    </>
  )
}

function SquadList({ team }) {
  const players = team.players || []
  if (!team.rosterLoaded || players.length === 0) {
    return (
      <EmptyState
        glyph="📋"
        title="Roster pending"
        sub={`${team.name}'s squad will appear here once the campus submits its players.`}
      />
    )
  }

  const bySport = {
    soccer: players.filter((p) => p.sport === 'soccer'),
    netball: players.filter((p) => p.sport === 'netball'),
    other: players.filter((p) => p.sport == null),
  }

  return (
    <>
      <div className="tc-head" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
        <Crest team={team} />
        <span style={{ fontWeight: 800, color: '#3f4346', fontSize: 16 }}>{team.name}</span>
        <span className="chip" style={{ marginLeft: 'auto' }}>{players.length} listed</span>
      </div>

      <SportGroup title="⚽ Soccer" players={bySport.soccer} />
      <SportGroup title="🏐 Netball" players={bySport.netball} />
      <SportGroup title="Team staff" players={bySport.other} />
    </>
  )
}

function SportGroup({ title, players }) {
  if (!players.length) return null
  return (
    <>
      <div className="kicker section-label">{title}</div>
      <div className="card">
        {players.map((p) => (
          <div className="squad-player" key={p.id}>
            <span className="nm">{p.firstName} {p.surname}</span>
            <span className="tags">
              {p.isGK && <span className="tag-role tag-gk">GK</span>}
              {p.role === 'support' && <span className="tag-role">Support</span>}
              {p.role === 'hoc' && <span className="tag-role">HOC</span>}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
