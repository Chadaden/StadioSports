import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { useRole } from '../store/RoleContext'
import { Crest, EmptyState } from '../components/ui'
import PlayerCard from '../components/PlayerCard'

// SQUADS (§6, reached from Live): tabs per team, players listed by sport with
// role tags. Names / sport / role only — no PII (§7, §9). Teams without a
// roster show a clean "Roster pending" empty state. The manager of the team
// being viewed can tap a player to open the private details card.
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
  const { role, teamId } = useRole()
  const { profiles } = useData()
  const [openPlayerId, setOpenPlayerId] = useState(null)
  const players = team.players || []
  // Only the team's own manager gets tappable rows + the private details card.
  const isOwnManager = role === 'manager' && teamId === team.id

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
  const openPlayer = players.find((p) => p.id === openPlayerId)

  return (
    <>
      <div className="tc-head" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
        <Crest team={team} />
        <span style={{ fontWeight: 800, color: '#3f4346', fontSize: 16 }}>{team.name}</span>
        <span className="chip" style={{ marginLeft: 'auto' }}>{players.length} listed</span>
      </div>

      {isOwnManager && (
        <div className="muted" style={{ fontSize: 11.5, margin: '0 2px 10px' }}>
          Manager view — tap a player for medical & emergency details.
        </div>
      )}

      <SportGroup title="⚽ Soccer" players={bySport.soccer} onOpen={isOwnManager ? setOpenPlayerId : null} />
      <SportGroup title="🏐 Netball" players={bySport.netball} onOpen={isOwnManager ? setOpenPlayerId : null} />
      <SportGroup title="Team staff" players={bySport.other} onOpen={isOwnManager ? setOpenPlayerId : null} />

      {isOwnManager && openPlayer && (
        <PlayerCard
          player={openPlayer}
          team={team}
          profile={profiles?.[openPlayer.id]}
          onClose={() => setOpenPlayerId(null)}
        />
      )}
    </>
  )
}

function SportGroup({ title, players, onOpen }) {
  if (!players.length) return null
  return (
    <>
      <div className="kicker section-label">{title}</div>
      <div className="card">
        {players.map((p) => {
          const inner = (
            <>
              <span className="nm">{p.firstName} {p.surname}</span>
              <span className="tags">
                {p.isGK && <span className="tag-role tag-gk">GK</span>}
                {p.role === 'support' && <span className="tag-role">Support</span>}
                {p.role === 'hoc' && <span className="tag-role">HOC</span>}
                {onOpen && <span className="muted">›</span>}
              </span>
            </>
          )
          return onOpen ? (
            <button className="squad-player squad-open" key={p.id} onClick={() => onOpen(p.id)}>
              {inner}
            </button>
          ) : (
            <div className="squad-player" key={p.id}>{inner}</div>
          )
        })}
      </div>
    </>
  )
}
