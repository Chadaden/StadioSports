import { useState } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { useIsScorekeeper } from '../store/RoleContext'
import { Crest, LiveBadge, EmptyState, SectionLabel } from '../components/ui'
import { PHASE_LABELS, formatClock, useClockTick } from '../lib/clock'

// LIVE tab (§6): hero for the in-progress pairing (both sports), "Up next",
// then the announcements feed. Viewer is read-only; the Scorekeeper can post
// announcements to the feed. (Team Manager gets the Team tab instead — §3.)
export default function LiveScreen() {
  const { fixtures = [], announcements = [] } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()

  const liveFx = fixtures.find((f) => f.soccer?.status === 'live' || f.netball?.status === 'live')
  const upNext = fixtures
    .filter((f) => f.soccer?.status === 'upcoming' || f.netball?.status === 'upcoming')
    .filter((f) => f.homeTeamId && f.awayTeamId)
    .slice(0, 3)

  const hero = liveFx || upNext[0]

  return (
    <>
      {hero ? (
        <MatchHero fixture={hero} teams={teams} live={Boolean(liveFx)} />
      ) : (
        <div className="card">
          <EmptyState
            title="No match in progress"
            sub="Live scores appear here the moment the first whistle goes."
          />
        </div>
      )}

      <SectionLabel>Up next</SectionLabel>
      {upNext.length ? (
        upNext.map((f) => <UpNextCard key={f.id} fixture={f} teams={teams} />)
      ) : (
        <div className="card tight muted center">All fixtures complete.</div>
      )}

      <SectionLabel>Announcements</SectionLabel>
      {isScorekeeper && <AnnouncementComposer />}
      <div className="card">
        {announcements.length ? (
          announcements.map((a) => (
            <div className="ann" key={a.id}>
              <div className="ann-mark" />
              <div className="ann-body">{a.body}</div>
            </div>
          ))
        ) : (
          <div className="muted center" style={{ padding: '8px 0' }}>No announcements yet.</div>
        )}
      </div>
    </>
  )
}

function MatchHero({ fixture, teams, live }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  return (
    <div className={`hero${live ? ' is-live' : ''}`}>
      <div className="hero-top">
        {live ? <LiveBadge /> : <span className="chip chip-upcoming">Up next · {fixture.slotTime}</span>}
        <span className="kicker">Match {fixture.matchNo}</span>
      </div>
      <div className="pairing">
        <div className="side"><Crest team={home} size="lg" /><b>{home?.name}</b></div>
        <span className="vs">vs</span>
        <div className="side"><Crest team={away} size="lg" /><b>{away?.name}</b></div>
      </div>
      {['soccer', 'netball'].map((sport) => (
        <SportLine key={sport} sport={sport} data={fixture[sport]} />
      ))}
    </div>
  )
}

function SportLine({ sport, data }) {
  const now = useClockTick(data?.clock)
  const showScore = data?.status === 'live' || data?.status === 'final'
  return (
    <>
      <div className={`sportline ${sport}`}>
        <span className="label">{sport[0].toUpperCase() + sport.slice(1)}</span>
        <span className="score">
          {showScore ? (
            <>{data.home}<span className="dash">–</span>{data.away}</>
          ) : (
            <span className="dash" style={{ fontSize: 18 }}>vs</span>
          )}
        </span>
        <span style={{ justifySelf: 'end' }}>
          {data?.status === 'live' && data.clock && (
            <span className="chip chip-clock">
              ⏱ {formatClock(data.clock, now)} · {PHASE_LABELS[data.clock.phase] || ''}
            </span>
          )}
          {data?.status === 'live' && !data.clock && (
            <span className="chip" style={{ color: 'var(--red)' }}>●</span>
          )}
        </span>
      </div>
      <ScorerFeed sport={sport} scorers={data?.scorers} />
    </>
  )
}

// "20' Jones scored" — every goal the scorekeeper logs, latest first.
function ScorerFeed({ sport, scorers }) {
  if (!scorers?.length) return null
  return (
    <div className="scorer-feed">
      {[...scorers].reverse().map((sc, i) => (
        <span className="ev-chip" key={i}>
          {sport === 'soccer' ? 'Soccer' : 'Netball'}: {sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}
        </span>
      ))}
    </div>
  )
}

function UpNextCard({ fixture, teams }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  return (
    <div className="card tight fixture">
      <div className="fx-pair" style={{ marginBottom: 0 }}>
        <Crest team={home} size="sm" />
        <span className="name">{home?.code}</span>
        <span className="muted" style={{ fontSize: 12 }}>vs</span>
        <span className="name">{away?.code}</span>
        <Crest team={away} size="sm" />
        <span className="fx-time" style={{ marginLeft: 'auto' }}>{fixture.slotTime}</span>
      </div>
    </div>
  )
}

function AnnouncementComposer() {
  const { actions } = useData()
  const [body, setBody] = useState('')
  const submit = () => {
    actions.postAnnouncement(body)
    setBody('')
  }
  return (
    <div className="card tight ann-composer">
      <textarea
        rows={2}
        placeholder="Post an announcement to the feed…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button disabled={!body.trim()} onClick={submit}>Post</button>
    </div>
  )
}
