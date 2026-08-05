// Stardial LIVE screen — the pocket jumbotron.
// Same data + actions as the classic LiveScreen (read-only viewer, scorekeeper
// may post announcements); only the presentation is new. Soccer and netball
// each get their own full board — live, else that sport's own next fixture,
// else its own last result, else a quiet "nothing on" state — so neither sport
// reads as more important than the other (§7). Everything after the two
// boards sits on a white sheet that slides over them. No icons.

import { useState } from 'react'
import { useData, useTeamMap } from '../../store/DataProvider'
import { useIsScorekeeper } from '../../store/RoleContext'
import { PHASE_LABELS, formatClock, useClockTick } from '../../lib/clock'
import { finalChampions, headlinePairing, sportHomeAwayIds } from '../../lib/matchState'
import { SdCrest, LivePill, ScorePop, SectionTitle, ModeChip } from './bits'

const SPORTS = ['soccer', 'netball']

export default function SdLiveScreen() {
  const { fixtures = [], announcements = [], event, isLive } = useData()
  const teams = useTeamMap()
  const isScorekeeper = useIsScorekeeper()
  const champions = finalChampions(fixtures, Object.values(teams))

  const anyLive = fixtures.some((f) => f.soccer?.status === 'live' || f.netball?.status === 'live')
  const upNext = fixtures
    .filter((f) => f.soccer?.status === 'upcoming' || f.netball?.status === 'upcoming')
    .filter((f) => {
      const ids = headlinePairing(f)
      return ids.homeTeamId && ids.awayTeamId
    })
    .slice(0, 3)

  return (
    <>
      <section className={`sd-hero${anyLive ? ' is-live' : ''}`}>
        <div className="sd-hero-bar">
          <span className="sd-kicker">{event?.name || 'STADIO · Sports Day'}</span>
          <ModeChip isLive={isLive} />
        </div>
        <div className="sd-twoup">
          {SPORTS.map((sport) => (
            <SportBoard key={sport} sport={sport} fixtures={fixtures} teams={teams} />
          ))}
        </div>
      </section>

      <div className="sd-sheet">
        {champions.length > 0 && <ChampionsBanner champions={champions} />}

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

function ChampionsBanner({ champions }) {
  return (
    <section className="sd-champions" aria-live="polite">
      <span className="sd-champions-kicker">These are the champions</span>
      <div className="sd-champions-grid">
        {champions.map(({ sport, team }) => (
          <div className={`sd-champion-card sd-champion-${sport}`} key={sport} style={{ '--tc': team.colorHex }}>
            <span>{`2026 ${sport} champions`}</span>
            <b>{team.name}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---- one sport's own board ------------------------------------------------ */

// live → this sport's own next fixture → this sport's own last result → quiet
// empty state. Resolved independently per sport, so soccer being live never
// pushes netball into a lesser "secondary" slot, and vice versa.
function SportBoard({ sport, fixtures, teams }) {
  const liveFx = fixtures.find((f) => f[sport]?.status === 'live')
  const nextFx = !liveFx && fixtures.find((f) => {
    if (f[sport]?.status !== 'upcoming') return false
    const ids = sportHomeAwayIds(f, sport)
    return ids.homeTeamId && ids.awayTeamId
  })
  const lastFx = !liveFx && !nextFx && [...fixtures].reverse().find((f) => f[sport]?.status === 'final')
  const fixture = liveFx || nextFx || lastFx
  const live = Boolean(liveFx)
  const state = liveFx ? 'live' : nextFx ? 'next' : lastFx ? 'last' : 'empty'

  const { homeTeamId, awayTeamId } = fixture ? sportHomeAwayIds(fixture, sport) : {}
  const home = fixture ? teams[homeTeamId] : null
  const away = fixture ? teams[awayTeamId] : null
  const s = fixture?.[sport]
  const now = useClockTick(s?.clock)
  const showScore = s?.status === 'live' || s?.status === 'final'
  const latest = s?.scorers?.length ? s.scorers[s.scorers.length - 1] : null

  return (
    <div className={`sd-board sd-board-${sport}${live ? ' is-live' : ''}`}>
      <div className="sd-board-meta">
        <span className={`sd-board-sport-tag sport-${sport}`}>{sport}</span>
        {live && <LivePill compact />}
        {!live && state === 'next' && <span className="sd-tag sd-tag-onink">UP NEXT · {fixture.slotTime}</span>}
        {!live && state === 'last' && <span className="sd-tag sd-tag-onink">LAST RESULT</span>}
        {fixture && <span className="sd-board-match">MATCH {fixture.matchNo}</span>}
      </div>

      {fixture ? (
        <>
          <div className="sd-face">
            <TeamPanel team={home} side="home" />
            <div className="sd-mid">
              {showScore ? (
                <div className="sd-score">
                  <ScorePop value={s.home} />
                  <i>–</i>
                  <ScorePop value={s.away} />
                </div>
              ) : (
                <span className="sd-vs">VS</span>
              )}
            </div>
            <TeamPanel team={away} side="away" />
          </div>

          <div className="sd-board-sub">
            {s?.status === 'live' && s.clock ? (
              <span className="sd-clockpill">
                <b>{formatClock(s.clock, now)}</b>
                <span>· {(PHASE_LABELS[s.clock.phase] || '').toUpperCase()}</span>
              </span>
            ) : s?.status === 'final' ? (
              <span className="sd-clockpill done">FULL-TIME</span>
            ) : (
              <span className="sd-clockpill idle">FIRST WHISTLE {fixture.slotTime}</span>
            )}
            {latest && (
              <span className="sd-ticker">{latest.minute ? `${latest.minute}' ` : ''}{latest.name || 'Goal'}</span>
            )}
          </div>
        </>
      ) : (
        <div className="sd-board-empty">
          <b>No {sport} in progress</b>
          <span>Scores land here the moment the first whistle goes.</span>
        </div>
      )}
    </div>
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

/* ---- sheet content -------------------------------------------------------- */

function UpNextRow({ fixture, teams }) {
  const { homeTeamId, awayTeamId } = headlinePairing(fixture)
  const home = teams[homeTeamId]
  const away = teams[awayTeamId]
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
