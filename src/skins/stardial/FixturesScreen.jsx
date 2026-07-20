// Stardial FIXTURES — the day as a spine. A time rail runs down the left,
// every match hangs off it as a ticket; the live one is the loudest thing on
// screen, finals settle into quiet results. Scorekeepers get the remote inside
// each ticket (SdSkControls) and the existing MANCO report button/modal.
// Icon-free: sports are named, states are words, colour carries identity.

import { useData, useTeamMap } from '../../store/DataProvider'
import { useIsScorekeeper } from '../../store/RoleContext'
import { formatClock, useClockTick } from '../../lib/clock'
import { MancoReportButton } from '../../screens/MancoReport'
import { SdCrest, StatusTag } from './bits'
import SdSkControls from './SkControls'

const ROUND_LABEL = { roundRobin: 'ROUND ROBIN', playoff: '3RD/4TH PLAYOFF', final: 'FINAL' }

export default function SdFixturesScreen() {
  const { fixtures = [] } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()

  return (
    <>
      {isScorekeeper && <MancoReportButton />}
      <div className="sd-rail">
        {fixtures.map((f) => (
          <FixtureTicket key={f.id} fixture={f} teams={teams} showControls={isScorekeeper} />
        ))}
      </div>
    </>
  )
}

function FixtureTicket({ fixture, teams, showControls }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
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
          {['soccer', 'netball'].map((sport) => (
            <SportScoreRow key={sport} sport={sport} data={fixture[sport]} viewer={!showControls} />
          ))}
        </div>

        {showControls && <SdSkControls fixture={fixture} />}
      </div>
    </div>
  )
}

function SportScoreRow({ sport, data, viewer }) {
  const now = useClockTick(data?.clock)
  const live = data?.status === 'live'
  const show = live || data?.status === 'final'
  return (
    <>
      <div className={`sd-srow sd-srow-${sport}${live ? ' is-live' : ''}`}>
        <span className="sd-srow-name">{sport}</span>
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
