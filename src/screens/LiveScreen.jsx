import { useState } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { useIsScorekeeper } from '../store/RoleContext'
import { Crest, LiveBadge, EmptyState, SectionLabel } from '../components/ui'
import { SPORT_GLYPH } from '../lib/constants'

// LIVE tab (§6): hero for the in-progress pairing (both sports), "Up next",
// then the announcements feed. Viewer is read-only; the Scorekeeper can post
// announcements to the feed.
export default function LiveScreen({ onOpenSquads }) {
  const { fixtures = [], event, announcements = [] } = useData()
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
        <MatchHero fixture={hero} teams={teams} event={event} live={Boolean(liveFx)} />
      ) : (
        <div className="card">
          <EmptyState
            glyph="📡"
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

      <button className="card tight" style={btnRow} onClick={onOpenSquads}>
        <span style={{ fontWeight: 700, color: '#3f4346' }}>👥 View squads</span>
        <span className="muted">›</span>
      </button>

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

function MatchHero({ fixture, teams, event, live }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  return (
    <div className="hero">
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
      <StreamButton event={event} />
    </div>
  )
}

function SportLine({ sport, data }) {
  const showScore = data?.status === 'live' || data?.status === 'final'
  return (
    <div className="sportline">
      <span className="label">{SPORT_GLYPH[sport]} {sport[0].toUpperCase() + sport.slice(1)}</span>
      <span className="score">
        {showScore ? (
          <>{data.home}<span className="dash">–</span>{data.away}</>
        ) : (
          <span className="dash" style={{ fontSize: 18 }}>vs</span>
        )}
      </span>
      <span style={{ justifySelf: 'end' }}>
        {data?.status === 'live' && <span className="chip" style={{ color: 'var(--red)' }}>●</span>}
      </span>
    </div>
  )
}

function StreamButton({ event }) {
  const url = event?.streamUrl?.soccer || event?.streamUrl?.netball || ''
  if (!url) {
    return <button className="btn-stream" disabled>▶ Stream link coming soon</button>
  }
  return (
    <a className="btn-stream" href={url} target="_blank" rel="noreferrer">▶ Watch stream</a>
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

const btnRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  width: '100%', border: '1px solid var(--line)', cursor: 'pointer', textAlign: 'left',
}
