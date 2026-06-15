import { useData, useTeamMap } from '../store/DataProvider'
import { useIsScorekeeper } from '../store/RoleContext'
import { Crest, StatusChip } from '../components/ui'
import { SPORT_GLYPH } from '../lib/constants'
import ScorekeeperControls from './ScorekeeperControls'

// FIXTURES tab (§6): all eight matches in time order, each showing the pairing
// and the soccer + netball lines. Viewer is read-only; the Scorekeeper sees
// inline live-scoring controls on each match.
export default function FixturesScreen() {
  const { fixtures = [] } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()

  return (
    <>
      {isScorekeeper && (
        <div className="card tight sk-banner">
          🎛️ Scorekeeper mode — tap to score live. Changes appear instantly for everyone.
        </div>
      )}
      {fixtures.map((f) => (
        <FixtureCard key={f.id} fixture={f} teams={teams} showControls={isScorekeeper} />
      ))}
    </>
  )
}

const ROUND_LABEL = { roundRobin: 'Round robin', playoff: '3rd / 4th playoff', final: 'Final' }

function FixtureCard({ fixture, teams, showControls }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  // Overall card status = the more advanced of the two sports.
  const status =
    fixture.soccer?.status === 'live' || fixture.netball?.status === 'live' ? 'live'
    : fixture.soccer?.status === 'final' && fixture.netball?.status === 'final' ? 'final'
    : 'upcoming'

  return (
    <div className="card fixture">
      <div className="fx-head">
        <span className="fx-time">{fixture.slotTime} · {ROUND_LABEL[fixture.round]}</span>
        <StatusChip status={status} />
      </div>

      <div className="fx-pair">
        <Crest team={home} size="sm" />
        <span className="name">{home ? home.name : 'TBD'}</span>
        <span className="mid">vs</span>
        <span className="name">{away ? away.name : 'TBD'}</span>
        <Crest team={away} size="sm" />
      </div>

      <div className="fx-scores">
        {['soccer', 'netball'].map((sport) => {
          const s = fixture[sport]
          const show = s?.status === 'live' || s?.status === 'final'
          return (
            <div className="cell" key={sport}>
              <span className="s-label">{SPORT_GLYPH[sport]} {sport === 'soccer' ? 'Soccer' : 'Netball'}</span>
              <span className="s-val">{show ? `${s.home}–${s.away}` : '—'}</span>
            </div>
          )
        })}
      </div>

      {showControls && <ScorekeeperControls fixture={fixture} />}
    </div>
  )
}
