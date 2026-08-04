// Stardial FIXTURES — the day as a spine. A time rail runs down the left,
// every match hangs off it as a ticket; the live one is the loudest thing on
// screen, finals settle into quiet results. Scorekeepers get the remote inside
// each ticket (SdSkControls) and the existing MANCO report button/modal.
// Icon-free: sports are named, states are words, colour carries identity.

import { useData, useTeamMap } from '../../store/DataProvider'
import { useIsScorekeeper } from '../../store/RoleContext'
import { formatClock, useClockTick } from '../../lib/clock'
import { headlinePairing, sportHomeAwayIds } from '../../lib/matchState'
import { computeStandings } from '../../lib/standings'
import { MancoReportButton } from '../../screens/MancoReport'
import { SdCrest, StatusTag } from './bits'
import SdSkControls from './SkControls'

const ROUND_LABEL = { roundRobin: 'ROUND ROBIN', playoff: '3RD/4TH PLAYOFF', final: 'FINAL' }
const SPORTS = ['soccer', 'netball']

export default function SdFixturesScreen() {
  const { fixtures = [], teams: teamList = [], event } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()

  return (
    <>
      {isScorekeeper && <MancoReportButton />}
      <div className={isScorekeeper ? 'sd-scorekeeper-layout' : undefined}>
        <div className="sd-rail">
          {fixtures.map((f) => (
            <FixtureTicket key={f.id} fixture={f} teams={teams} showControls={isScorekeeper} />
          ))}
        </div>
        {isScorekeeper && <ScorekeeperContext fixtures={fixtures} teams={teamList} event={event} />}
      </div>
    </>
  )
}

function ScorekeeperContext({ fixtures, teams, event }) {
  return (
    <aside className="sd-sk-context" aria-label="Match-day reference">
      <div className="sd-sk-context-head">
        <span>Match-day reference</span>
        <small>Updates as scores publish</small>
      </div>

      <section className="sd-sk-context-section">
        <b>Fixture progress</b>
        <div className="sd-sk-fixture-list">
          {fixtures.map((fixture) => {
            const { homeTeamId, awayTeamId } = headlinePairing(fixture)
            const home = teams.find((team) => team.id === homeTeamId)
            const away = teams.find((team) => team.id === awayTeamId)
            const live = fixture.soccer?.status === 'live' || fixture.netball?.status === 'live'
            const final = fixture.soccer?.status === 'final' && fixture.netball?.status === 'final'
            return (
              <div className={`sd-sk-fixture${live ? ' is-live' : ''}${final ? ' is-final' : ''}`} key={fixture.id}>
                <span>M{fixture.matchNo}</span>
                <b>{home?.code || 'TBD'} <i>v</i> {away?.code || 'TBD'}</b>
                <small>{live ? 'LIVE' : final ? 'DONE' : fixture.slotTime}</small>
              </div>
            )
          })}
        </div>
      </section>

      {['soccer', 'netball'].map((sport) => (
        <CompactTable key={sport} sport={sport} fixtures={fixtures} teams={teams} event={event} />
      ))}
    </aside>
  )
}

function CompactTable({ sport, fixtures, teams, event }) {
  const rows = computeStandings(sport, fixtures, teams, event)
  return (
    <section className="sd-sk-context-section">
      <b>{sport} table</b>
      <div className="sd-sk-table">
        {rows.map((row) => (
          <div key={row.team.id} style={{ '--tc': row.team.colorHex }}>
            <span>{row.rank}</span><b>{row.team.code}</b><small>{row.played} played</small><strong>{row.points} pts</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function FixtureTicket({ fixture, teams, showControls }) {
  const { homeTeamId, awayTeamId } = headlinePairing(fixture)
  const home = teams[homeTeamId]
  const away = teams[awayTeamId]
  const status =
    fixture.soccer?.status === 'live' || fixture.netball?.status === 'live' ? 'live'
    : fixture.soccer?.status === 'final' && fixture.netball?.status === 'final' ? 'final'
    : 'upcoming'

  return (
    <div className={`sd-stop is-${status}`}>
      <div className="sd-stop-node">
        <span className="sd-stop-time">{fixture.slotTime}</span>
        <span className="sd-stop-dot" />
      </div>

      <div className="sd-ticket">
        <div className="sd-ticket-head">
          <span className="sd-ticket-round">M{fixture.matchNo} · {ROUND_LABEL[fixture.round]}</span>
          <StatusTag status={status} />
        </div>

        <div className="sd-ticket-pair">
          <span className="sd-ticket-side">
            <SdCrest team={home} />
            <b>{home ? home.name : 'TBD'}</b>
          </span>
          <i>vs</i>
          <span className="sd-ticket-side away">
            <b>{away ? away.name : 'TBD'}</b>
            <SdCrest team={away} />
          </span>
        </div>

        <div className="sd-ticket-sports">
          {SPORTS.map((sport) => (
            <SportScoreRow key={sport} fixture={fixture} sport={sport} teams={teams}
              headlineHomeTeamId={homeTeamId} headlineAwayTeamId={awayTeamId}
              viewer={!showControls} />
          ))}
        </div>

        {showControls && <SdSkControls fixture={fixture} />}
      </div>
    </div>
  )
}

function SportScoreRow({ fixture, sport, teams, headlineHomeTeamId, headlineAwayTeamId, viewer }) {
  const data = fixture[sport]
  const now = useClockTick(data?.clock)
  const live = data?.status === 'live'
  const show = live || data?.status === 'final'
  const { homeTeamId, awayTeamId } = sportHomeAwayIds(fixture, sport)
  // Only the rare case where this sport's own pairing (§8) doesn't match the
  // ticket's headline pairing needs its own label — otherwise it'd just repeat
  // what the header already says.
  const diverges = Boolean(homeTeamId) && Boolean(awayTeamId)
    && (homeTeamId !== headlineHomeTeamId || awayTeamId !== headlineAwayTeamId)

  return (
    <>
      <div className={`sd-srow sd-srow-${sport}${live ? ' is-live' : ''}`}>
        <span className="sd-srow-name">{sport}</span>
        {diverges && (
          <span className="sd-srow-pair">{teams[homeTeamId]?.code || 'TBD'} <i>v</i> {teams[awayTeamId]?.code || 'TBD'}</span>
        )}
        {live && data.clock && (
          <span className="sd-srow-clock">{formatClock(data.clock, now)}</span>
        )}
        <span className="sd-srow-score">{show ? <>{data.home}<i>–</i>{data.away}</> : '—'}</span>
      </div>
      {/* viewer-only goal feed; the scorekeeper remote lists its own events */}
      {viewer && data?.scorers?.length > 0 && (
        <div className="sd-feed">
          {[...data.scorers].reverse().map((sc, i) => (
            <span className="sd-ev" key={i}>{sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}</span>
          ))}
        </div>
      )}
    </>
  )
}
