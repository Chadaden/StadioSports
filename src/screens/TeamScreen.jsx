import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { useRole } from '../store/RoleContext'
import { Crest, EmptyState } from '../components/ui'
import PlayerCard from '../components/PlayerCard'

// TEAM tab (§3, §6) — Team Manager only. Replaces Live as the manager's first
// tab: their own campus roster (soccer + netball + support/HOC) as tappable
// cards, opening the private PlayerCard (contact, emergency, medical,
// dietary). Other campuses' rosters are also browsable — names/sport/role
// only, no PII — via the same segmented control (§7, §9).
export default function TeamScreen() {
  const { teams = [] } = useData()
  const { teamId: myTeamId } = useRole()
  const [active, setActive] = useState(myTeamId || teams[0]?.id)
  const team = teams.find((t) => t.id === active) || teams.find((t) => t.id === myTeamId) || teams[0]

  return (
    <>
      <div className="segmented" style={{ flexWrap: 'wrap' }}>
        {teams.map((t) => (
          <button key={t.id} className={t.id === active ? 'active' : ''} onClick={() => setActive(t.id)}>
            {t.code}
          </button>
        ))}
      </div>

      {team && <TeamRoster team={team} />}
    </>
  )
}

function TeamRoster({ team }) {
  const { teamId: myTeamId } = useRole()
  const { profiles } = useData()
  const [openPlayerId, setOpenPlayerId] = useState(null)
  const players = team.players || []
  const isOwnTeam = myTeamId === team.id

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

      {isOwnTeam && (
        <div className="muted" style={{ fontSize: 11.5, margin: '0 2px 10px' }}>
          Tap a player for contact, emergency, medical & dietary details.
        </div>
      )}

      <SportGroup title="⚽ Soccer" players={bySport.soccer} onOpen={isOwnTeam ? setOpenPlayerId : null} />
      <SportGroup title="🏐 Netball" players={bySport.netball} onOpen={isOwnTeam ? setOpenPlayerId : null} />
      <SportGroup title="Team staff" players={bySport.other} onOpen={isOwnTeam ? setOpenPlayerId : null} />

      {isOwnTeam && openPlayer && (
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
