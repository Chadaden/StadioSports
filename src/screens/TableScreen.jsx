import { useState, useMemo } from 'react'
import { useData } from '../store/DataProvider'
import { computeStandings } from '../lib/standings'
import { Crest, EmptyState } from '../components/ui'

// TABLE tab (§6): segmented Soccer/Netball, standings computed from played
// round-robin fixtures (§7). Leader highlighted. No combined champion (§11).
export default function TableScreen() {
  const { fixtures = [], teams = [], event } = useData()
  const [sport, setSport] = useState('soccer')

  const rows = useMemo(
    () => computeStandings(sport, fixtures, teams, event),
    [sport, fixtures, teams, event],
  )
  const anyPlayed = rows.some((r) => r.played > 0)

  return (
    <>
      <div className="segmented" role="tablist">
        <button role="tab" className={sport === 'soccer' ? 'active' : ''} onClick={() => setSport('soccer')}>⚽ Soccer</button>
        <button role="tab" className={sport === 'netball' ? 'active' : ''} onClick={() => setSport('netball')}>🏐 Netball</button>
      </div>

      <div className="card">
        <table className="standings">
          <thead>
            <tr>
              <th className="lhs">#</th>
              <th className="lhs">Team</th>
              <th>P</th><th>W</th><th>D</th><th>L</th><th>+/−</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team.id} className={r.rank === 1 && anyPlayed ? 'leader' : ''}>
                <td className="lhs rank">{r.rank}</td>
                <td className="team lhs"><Crest team={r.team} size="sm" />{r.team.name}</td>
                <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                <td>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                <td className="pts">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!anyPlayed && (
        <EmptyState
          glyph="🏆"
          title="No results yet"
          sub="The table fills in as round-robin matches reach full-time. Top two advance to the final; 3rd & 4th meet in the playoff."
        />
      )}
    </>
  )
}
