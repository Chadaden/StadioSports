import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { useRole } from '../store/RoleContext'
import { Crest, EmptyState } from '../components/ui'
import PlayerCard from '../components/PlayerCard'

// TEAM tab (§3, §6) — Team Manager only. Replaces Live as the manager's first
// tab: their own campus roster (soccer + netball + support/HOC) as tappable
// cards, opening the private PlayerCard (contact, emergency, medical,
// dietary). Scoped strictly to the manager's own campus — no browsing other
// campuses' rosters, not even names/sport/role (§9, client request 16 Jul).
export default function TeamScreen() {
  const { teams = [] } = useData()
  const { teamId: myTeamId } = useRole()
  const team = teams.find((t) => t.id === myTeamId)

  if (!team) {
    return (
      <EmptyState
        glyph="🚫"
        title="No team assigned"
        sub="This manager link isn't tied to a campus — check the ?team= link you were sent."
      />
    )
  }

  return <TeamRoster team={team} />
}

function TeamRoster({ team }) {
  const { profiles } = useData()
  const [openPlayerId, setOpenPlayerId] = useState(null)
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
  const openPlayer = players.find((p) => p.id === openPlayerId)

  return (
    <>
      <div className="tc-head" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
        <Crest team={team} />
        <span style={{ fontWeight: 800, color: '#3f4346', fontSize: 16 }}>{team.name}</span>
        <span className="chip" style={{ marginLeft: 'auto' }}>{players.length} listed</span>
      </div>

      <div className="muted" style={{ fontSize: 11.5, margin: '0 2px 10px' }}>
        Tap a player for contact, emergency, medical & dietary details.
      </div>

      <SportGroup title="⚽ Soccer" players={bySport.soccer} onOpen={setOpenPlayerId} />
      <SportGroup title="🏐 Netball" players={bySport.netball} onOpen={setOpenPlayerId} />
      <SportGroup title="Team staff" players={bySport.other} onOpen={setOpenPlayerId} />

      {openPlayer && (
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
