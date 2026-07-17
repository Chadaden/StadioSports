// Stardial LIVE screen — the pocket jumbotron.
// Same data + actions as the classic LiveScreen (read-only viewer, scorekeeper
// may post announcements); only the presentation is new. The in-progress
// pairing becomes a full-bleed broadcast scoreboard: team-colour wedges facing
// off, the score enormous in the middle, clock ticking beneath. Everything
// after it sits on a white sheet that slides over the board. No icons.

import { useState } from 'react'
import { useData, useTeamMap } from '../../store/DataProvider'
import { useIsScorekeeper } from '../../store/RoleContext'
import { PHASE_LABELS, formatClock, useClockTick } from '../../lib/clock'
import { SdCrest, LivePill, ScorePop, SectionTitle, ModeChip } from './bits'

export default function SdLiveScreen() {
  const { fixtures = [], announcements = [], event, isLive } = useData()
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
      <Scoreboard fixture={hero} teams={teams} live={Boolean(liveFx)} eventName={event?.name} isLiveData={isLive} />

      <div className="sd-sheet">
        <SectionTitle right={upNext.length ? `${upNext.length} of ${fixtures.length}` : null}>
          Up next
        </SectionTitle>
        {upNext.length ? (
          upNext.map((f) => <UpNextRow key={f.id} fixture={f} teams={teams} />)
        ) : (
          <div className="sd-quiet">All fixtures complete — final standings are on the Table tab.</div>
        )}

        <SectionTitle>Announcements</SectionTitle>
        {isScorekeeper && <Composer />}
        {announcements.length ? (
          <div className="sd-annlist">
            {announcements.map((a) => (
              <div className="sd-ann" key={a.id}><p>{a.body}</p></div>
            ))}
          </div>
        ) : (
          <div className="sd-quiet">Nothing posted yet.</div>
        )}
      </div>
    </>
  )
}

/* ---- the board ----------------------------------------------------------- */

// Picks the sport that deserves the big numerals: a live sport first, else the
// first with a result, else soccer. The other sport gets the compact strip.
function pickPrimary(fixture) {
  const order = ['soccer', 'netball']
  const live = order.find((s) => fixture?.[s]?.status === 'live')
  if (live) return live
  const scored = order.find((s) => fixture?.[s]?.status === 'final')
  return scored || 'soccer'
}

function Scoreboard({ fixture, teams, live, eventName, isLiveData }) {
  const home = fixture ? teams[fixture.homeTeamId] : null
  const away = fixture ? teams[fixture.awayTeamId] : null
  const primary = fixture ? pickPrimary(fixture) : 'soccer'
  const secondary = primary === 'soccer' ? 'netball' : 'soccer'
  const p = fixture?.[primary]
  const now = useClockTick(p?.clock)
  const showScore = p?.status === 'live' || p?.status === 'final'
  const latest = p?.scorers?.length ? p.scorers[p.scorers.length - 1] : null

  return (
    <section className={`sd-hero${live ? ' is-live' : ''}`}>
      <div className="sd-hero-bar">
        <span className="sd-kicker">{eventName || 'STADIO · Sports Day'}</span>
        <ModeChip isLive={isLiveData} />
      </div>

      {fixture ? (
        <div className="sd-board">
          <div className="sd-board-meta">
            {live ? <LivePill /> : <span className="sd-tag sd-tag-onink">UP NEXT · {fixture.slotTime}</span>}
            <span className="sd-board-match">MATCH {fixture.matchNo}</span>
          </div>

          <div className="sd-face">
            <TeamPanel team={home} side="home" />
            <div className="sd-mid">
              {showScore ? (
                <div className="sd-score">
                  <ScorePop value={p.home} />
                  <i>–</i>
                  <ScorePop value={p.away} />
                </div>
              ) : (
                <span className="sd-vs">VS</span>
              )}
              <span className="sd-mid-sport">{primary}</span>
            </div>
            <TeamPanel team={away} side="away" />
          </div>

          <div className="sd-board-sub">
            {p?.status === 'live' && p.clock ? (
              <span className="sd-clockpill">
                <b>{formatClock(p.clock, now)}</b>
                <span>· {(PHASE_LABELS[p.clock.phase] || '').toUpperCase()}</span>
              </span>
            ) : p?.status === 'final' ? (
              <span className="sd-clockpill done">FULL-TIME</span>
            ) : (
              <span className="sd-clockpill idle">FIRST WHISTLE {fixture.slotTime}</span>
            )}
            {latest && (
              <span className="sd-ticker">{latest.minute ? `${latest.minute}' ` : ''}{latest.name || 'Goal'}</span>
            )}
          </div>

          <AltSportStrip fixture={fixture} sport={secondary} />
        </div>
      ) : (
        <div className="sd-board sd-board-empty">
          <b>No match in progress</b>
          <span>Scores land here the moment the first whistle goes.</span>
        </div>
      )}
    </section>
  )
}

function TeamPanel({ team, side }) {
  return (
    <div className={`sd-panel sd-panel-${side}`} style={{ '--tc': team?.colorHex || '#5c636b' }}>
      <b>{team?.code || 'TBD'}</b>
      <span>{team?.name || 'From standings'}</span>
    </div>
  )
}

// The other sport, one quiet line on the board — never an empty fake match.
function AltSportStrip({ fixture, sport }) {
  const s = fixture[sport]
  const now = useClockTick(s?.clock)
  const scored = s?.status === 'live' || s?.status === 'final'
  return (
    <div className="sd-alt">
      <span className="sd-alt-name">{sport}</span>
      {scored ? (
        <span className="sd-alt-score">
          {s.home}<i>–</i>{s.away}
          {s.status === 'live' && s.clock && <em>{formatClock(s.clock, now)}</em>}
          {s.status === 'final' && <em className="done">FT</em>}
        </span>
      ) : (
        <span className="sd-alt-wait">starts after this match</span>
      )}
    </div>
  )
}

/* ---- sheet content -------------------------------------------------------- */

function UpNextRow({ fixture, teams }) {
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  return (
    <div className="sd-next">
      <span className="sd-next-time">{fixture.slotTime}</span>
      <span className="sd-next-pair">
        <SdCrest team={home} size="sm" />
        <SdCrest team={away} size="sm" />
      </span>
      <span className="sd-next-names">
        <b>{home?.name}</b> <i>vs</i> <b>{away?.name}</b>
      </span>
    </div>
  )
}

function Composer() {
  const { actions } = useData()
  const [body, setBody] = useState('')
  const submit = () => { actions.postAnnouncement(body); setBody('') }
  return (
    <div className="sd-composer">
      <textarea
        rows={2}
        placeholder="Post an announcement…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button disabled={!body.trim()} onClick={submit}>Post</button>
    </div>
  )
}
