import { useMemo } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { useIsScorekeeper } from '../store/RoleContext'
import { Crest, StatusChip, SectionLabel } from '../components/ui'
import { formatClock, useClockTick } from '../lib/clock'
import { projectBracket } from '../lib/standings'
import ScorekeeperControls from './ScorekeeperControls'
import { MancoReportButton } from './MancoReport'

// FIXTURES tab (§6): all eight matches in time order, each showing the pairing
// and the soccer + netball lines. Viewer is read-only; the Scorekeeper sees
// inline live-scoring controls on each match plus the MANCO report button.
export default function FixturesScreen() {
  const { fixtures = [], teams: teamsArr = [], event } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()

  // 3rd/4th playoff + final pairings, projected live from the round-robin
  // standings — computed independently per sport since soccer and netball
  // tables can diverge.
  const bracket = useMemo(() => ({
    soccer: projectBracket('soccer', fixtures, teamsArr, event),
    netball: projectBracket('netball', fixtures, teamsArr, event),
  }), [fixtures, teamsArr, event])

  return (
    <>
      <SectionLabel>STADIO Inter-campus Sports Day Fixtures</SectionLabel>
      {isScorekeeper && (
        <>
          <MancoReportButton />
          <div className="card tight sk-banner">
            Scorekeeper mode — tap to score live. Changes appear instantly for everyone.
          </div>
        </>
      )}
      {fixtures.map((f) => (
        <FixtureCard key={f.id} fixture={f} teams={teams} showControls={isScorekeeper} bracket={bracket} />
      ))}
    </>
  )
}

const ROUND_LABEL = { roundRobin: 'Round robin', playoff: '3rd / 4th playoff', final: 'Final' }
const BRACKET_KEY = { playoff: 'playoff', final: 'final' }

function FixtureCard({ fixture, teams, showControls, bracket }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  const now = useClockTick(fixture.soccer?.clock, fixture.netball?.clock)
  // Overall card status = the more advanced of the two sports.
  const status =
    fixture.soccer?.status === 'live' || fixture.netball?.status === 'live' ? 'live'
    : fixture.soccer?.status === 'final' && fixture.netball?.status === 'final' ? 'final'
    : 'upcoming'
  const bracketKey = BRACKET_KEY[fixture.round]

  return (
    <div className={`card fixture${status === 'live' ? ' is-live' : ''}`}>
      <div className="fx-head">
        <span className="fx-time">{fixture.slotTime} · {ROUND_LABEL[fixture.round]}</span>
        <StatusChip status={status} />
      </div>

      {bracketKey ? (
        <>
          <BracketPairing sport="soccer" projection={bracket?.soccer?.[bracketKey]} />
          <BracketPairing sport="netball" projection={bracket?.netball?.[bracketKey]} />
        </>
      ) : (
        <div className="fx-pair">
          <Crest team={home} size="sm" />
          <span className="name">{home ? home.name : 'TBD'}</span>
          <span className="mid">vs</span>
          <span className="name">{away ? away.name : 'TBD'}</span>
          <Crest team={away} size="sm" />
        </div>
      )}

      <div className="fx-scores">
        {['soccer', 'netball'].map((sport) => {
          const s = fixture[sport]
          const show = s?.status === 'live' || s?.status === 'final'
          return (
            <div className={`cell ${sport}`} key={sport}>
              <span className="s-label">{sport === 'soccer' ? 'Soccer' : 'Netball'}</span>
              <span className="s-val">{show ? `${s.home}–${s.away}` : '—'}</span>
              {s?.status === 'live' && s.clock && (
                <span className="s-clock">⏱ {formatClock(s.clock, now)}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Viewer goal feed — the scorekeeper panel below has its own richer list */}
      {!showControls && ['soccer', 'netball'].map((sport) => {
        const scorers = fixture[sport]?.scorers
        if (!scorers?.length) return null
        return (
          <div className="scorer-feed" key={sport}>
            {[...scorers].reverse().map((sc, i) => (
              <span className="ev-chip" key={i}>
                {sport === 'soccer' ? 'Soccer' : 'Netball'}: {sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}
              </span>
            ))}
          </div>
        )
      })}

      {showControls && <ScorekeeperControls fixture={fixture} />}
    </div>
  )
}

// Playoff/final pairing projected from the current standings for one sport.
// `projection` is null until at least one round-robin result for that sport
// is in, so it renders as a plain TBD until there's something to show.
function BracketPairing({ sport, projection }) {
  const [a, b] = projection || []
  return (
    <div className="fx-pair-bracket">
      <div className="fx-pair-bracket-head">
        <span className="s-label">{sport === 'soccer' ? 'Soccer' : 'Netball'}</span>
        {projection && <span className="chip">As it stands</span>}
      </div>
      <div className="fx-pair">
        <Crest team={a} size="sm" />
        <span className="name">{a ? a.name : 'TBD'}</span>
        <span className="mid">vs</span>
        <span className="name">{b ? b.name : 'TBD'}</span>
        <Crest team={b} size="sm" />
      </div>
    </div>
  )
}
