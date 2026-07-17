// Stardial TABLE — a leaderboard, not a spreadsheet. Rank numerals big, each
// team riding its own colour spine, the leader lifted on their team colour
// with the trophy. Same computeStandings + segmented sport switch as classic.

import { useState, useMemo } from 'react'
import { useData } from '../../store/DataProvider'
import { computeStandings } from '../../lib/standings'
import Icon, { SPORT_ICON } from './icons'
import { SdCrest } from './bits'

export default function SdTableScreen() {
  const { fixtures = [], teams = [], event } = useData()
  const [sport, setSport] = useState('soccer')

  const rows = useMemo(
    () => computeStandings(sport, fixtures, teams, event),
    [sport, fixtures, teams, event],
  )
  const anyPlayed = rows.some((r) => r.played > 0)

  return (
    <>
      <div className="sd-seg sd-seg-sport" role="tablist">
        {['soccer', 'netball'].map((s) => (
          <button
            key={s} role="tab"
            className={sport === s ? 'active' : ''}
            onClick={() => setSport(s)}
          >
            <Icon name={SPORT_ICON[s]} size={16} />
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="sd-board-list">
        <div className="sd-lb-cols" aria-hidden="true">
          <span>P</span><span>W</span><span>D</span><span>L</span><span>+/−</span><span className="pts">PTS</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.team.id}
            className={`sd-lb-row${r.rank === 1 && anyPlayed ? ' is-leader' : ''}`}
            style={{ '--tc': r.team.colorHex }}
          >
            <span className="sd-lb-rank">{r.rank}</span>
            <span className="sd-lb-team">
              <SdCrest team={r.team} />
              <b>{r.team.name}</b>
              {r.rank === 1 && anyPlayed && <Icon name="trophy" size={15} className="sd-lb-cup" />}
            </span>
            <span className="sd-lb-nums">
              <span>{r.played}</span><span>{r.won}</span><span>{r.drawn}</span><span>{r.lost}</span>
              <span>{r.diff > 0 ? `+${r.diff}` : r.diff}</span>
            </span>
            <span className="sd-lb-pts">{r.points}</span>
          </div>
        ))}
      </div>

      {!anyPlayed && (
        <div className="sd-empty">
          <Icon name="trophy" size={30} />
          <b>No results yet</b>
          <span>The table fills in as round-robin matches reach full-time. Top two advance to the final; 3rd &amp; 4th meet in the playoff.</span>
        </div>
      )}
    </>
  )
}
