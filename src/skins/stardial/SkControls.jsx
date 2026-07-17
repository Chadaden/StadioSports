// Stardial scorekeeper panel — designed like a hardware remote: one glance,
// one thumb. Logic is a faithful port of screens/ScorekeeperControls.jsx —
// identical action calls, minute capture and picker flows — only the
// presentation changed. Classic remains untouched.

import { useState } from 'react'
import { useData, useTeamMap } from '../../store/DataProvider'
import {
  PHASE_LABELS, clockMinute, formatClock, isClockRunning, useFirstHalfAlert, useSecondTick,
} from '../../lib/clock'
import { formatDurationSeconds, sinBinRemainingSeconds } from '../../lib/matchState'
import Icon, { SPORT_ICON } from './icons'
import { LivePill, ScorePop } from './bits'

export default function SdSkControls({ fixture }) {
  if (!fixture.homeTeamId || !fixture.awayTeamId) {
    return <div className="sd-sk-note">Teams set on the day from the standings.</div>
  }
  return (
    <div className="sd-sk">
      {['soccer', 'netball'].map((sport) => (
        <SportRemote key={sport} fixture={fixture} sport={sport} />
      ))}
    </div>
  )
}

function SportRemote({ fixture, sport }) {
  const { actions } = useData()
  const teams = useTeamMap()
  const s = fixture[sport]
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  const [picker, setPicker] = useState(null) // { kind:'goal', side, minute } | { kind:'card' } | null
  const running = isClockRunning(s.clock)
  const hasActiveSinBin = (s.cards || []).some((card) => sinBinRemainingSeconds(card) > 0)
  const now = useSecondTick(running || hasActiveSinBin)
  const firstHalfReached = useFirstHalfAlert(s.clock, now)

  if (s.status === 'upcoming') {
    return (
      <div className={`sd-remote sd-remote-${sport}`}>
        <div className="sd-remote-head">
          <span className="sd-remote-sport"><Icon name={SPORT_ICON[sport]} size={16} />{sport}</span>
          <span className="sd-tag">UPCOMING</span>
        </div>
        <button className="sd-kickoff" onClick={() => actions.startSport(fixture.id, sport)}>
          <Icon name="whistle" size={20} />
          Open {sport} controls
          <small>timer stays stopped</small>
        </button>
      </div>
    )
  }

  const locked = s.status === 'final'
  // Reads the real clock at tap time, not the 1s render tick.
  const openGoalPicker = (side) =>
    setPicker({ kind: 'goal', side, minute: s.clock ? clockMinute(s.clock) : null })

  return (
    <div className={`sd-remote sd-remote-${sport}${locked ? ' is-locked' : ''}`}>
      <div className="sd-remote-head">
        <span className="sd-remote-sport"><Icon name={SPORT_ICON[sport]} size={16} />{sport}</span>
        {locked ? <span className="sd-tag sd-tag-final">FULL-TIME</span> : <LivePill />}
      </div>

      {s.clock && (
        <>
          <div className="sd-clockbox">
            <div className="sd-clockreadout">
              <Icon name="timer" size={18} className="sd-clockbox-ic" />
              <b>{formatClock(s.clock, now)}</b>
              <span className="sd-clockbox-phase">{(PHASE_LABELS[s.clock.phase] || '').toUpperCase()}</span>
            </div>
            {!locked && (
              <div className="sd-clockactions">
                {running ? (
                  <button className="sd-clockbtn hold" onClick={() => actions.pauseClock(fixture.id, sport)}><Icon name="pause" size={13} />Pause</button>
                ) : s.clock.phase === 'h1' && !s.clock.baseSeconds ? (
                  <button className="sd-clockbtn go" onClick={() => actions.startClock(fixture.id, sport)}><Icon name="play" size={13} />Start timer</button>
                ) : s.clock.phase !== 'ht' ? (
                  <button className="sd-clockbtn go" onClick={() => actions.resumeClock(fixture.id, sport)}><Icon name="play" size={13} />Resume</button>
                ) : null}
                {!running && (s.clock.phase === 'ht' || (s.clock.phase === 'h1' && s.clock.baseSeconds > 0)) && (
                  <button className="sd-clockbtn half" onClick={() => actions.startSecondHalf(fixture.id, sport)}><Icon name="play" size={13} />Second half</button>
                )}
                <button className="sd-clockbtn reset" onClick={() => {
                  if (window.confirm('Reset this timer to 0:00 and the first half? Scores and events will remain.')) {
                    actions.resetClock(fixture.id, sport)
                  }
                }}><Icon name="undo" size={13} />Reset</button>
              </div>
            )}
          </div>
          {firstHalfReached && !locked && <div className="sd-half-alert">10:00 reached — pause when the whistle goes.</div>}
        </>
      )}

      <div className="sd-sk-score">
        <span className="sd-sk-code" style={{ '--tc': home?.colorHex }}>{home?.code}</span>
        <span className="sd-sk-digits">
          <ScorePop value={s.home} /><i>–</i><ScorePop value={s.away} />
        </span>
        <span className="sd-sk-code" style={{ '--tc': away?.colorHex }}>{away?.code}</span>
      </div>

      {!locked && (
        <div className="sd-goalrow">
          {['home', 'away'].map((side) => {
            const team = side === 'home' ? home : away
            return (
              <div className="sd-goalteam" key={side}>
                <button className="sd-goalbtn" style={{ '--tc': team?.colorHex }}
                  onClick={() => sport === 'netball'
                    ? actions.adjustScore(fixture.id, sport, side, 1)
                    : openGoalPicker(side)}>
                  <span className="sd-goalbtn-plus"><Icon name="plus" size={16} /></span>
                  GOAL
                  <small>{team?.name}</small>
                </button>
                {sport === 'netball' && (
                  <button className="sd-goalremove" disabled={!s[side]}
                    onClick={() => actions.adjustScore(fixture.id, sport, side, -1)}>− Remove goal</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {sport === 'soccer' && picker?.kind === 'goal' && (
        <GoalPicker
          fixture={fixture} sport={sport} side={picker.side} minute={picker.minute}
          team={picker.side === 'home' ? home : away}
          onDone={() => setPicker(null)}
        />
      )}

      {(s.scorers?.length > 0 || s.cards?.length > 0) && (
        <div className="sd-events">
          {s.scorers.map((sc, i) => (
            <span className="sd-ev" key={`s${i}`}>
              <Icon name={SPORT_ICON[sport]} size={12} />
              {sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}
              {!locked && (
                <button className="sd-ev-x" aria-label="Remove goal"
                  onClick={() => actions.removeGoal(fixture.id, sport, i)}>
                  <Icon name="x" size={11} />
                </button>
              )}
            </span>
          ))}
          {s.cards.map((c, i) => {
            const remaining = sinBinRemainingSeconds(c, now)
            return (
              <span className={`sd-ev sd-ev-${c.type}`} key={`c${i}`}>
                <Icon name="card" size={12} />
                {c.minute ? `${c.minute}' ` : ''}{c.name || 'Player'}
                <b className="sd-ev-countdown">{remaining ? formatDurationSeconds(remaining) : 'served'}</b>
              </span>
            )
          })}
        </div>
      )}

      {!locked && (
        <>
          <div className="sd-sk-actions">
            <button className="sd-cardbtn" onClick={() => setPicker(picker?.kind === 'card' ? null : { kind: 'card' })}>
              <Icon name="card" size={15} />Card
            </button>
            <button className="sd-publish" onClick={() => actions.publishSport(fixture.id, sport)}>
              Publish full-time
            </button>
          </div>
          {picker?.kind === 'card' && (
            <CardPicker fixture={fixture} sport={sport} home={home} away={away}
              onDone={() => setPicker(null)} />
          )}
        </>
      )}

      {locked && (
        <button className="sd-reopen" onClick={() => actions.reopenSport(fixture.id, sport)}>
          <Icon name="undo" size={14} />Reopen match
        </button>
      )}
    </div>
  )
}

// Goal flow: the minute is already captured — just pick who scored.
function GoalPicker({ fixture, sport, side, minute, team, onDone }) {
  const { actions } = useData()
  const roster = (team?.players || []).filter((p) => p.sport === sport && p.role === 'player')
  const [freeText, setFreeText] = useState('')

  const commit = (name, playerId = null) => {
    actions.addGoal(fixture.id, sport, side, {
      playerId, teamId: team?.id ?? null, name, minute,
    })
    onDone()
  }

  return (
    <div className="sd-picker">
      <div className="sd-picker-title" style={{ '--tc': team?.colorHex }}>
        <b>{team?.code}</b> goal{minute ? ` · ${minute}'` : ''} — who scored?
      </div>
      {roster.length > 0 ? (
        <div className="sd-picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
            </button>
          ))}
          <button className="sd-picker-unknown" onClick={() => commit(null)}>Unknown / own goal</button>
        </div>
      ) : (
        <div className="sd-picker-free">
          <input placeholder="Player name" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          <button onClick={() => commit(freeText.trim() || null)}>Add</button>
        </div>
      )}
      <button className="sd-picker-cancel" onClick={onDone}>Cancel</button>
    </div>
  )
}

// Card flow: team → colour → player. Minute prefills from the match clock.
function CardPicker({ fixture, sport, home, away, onDone }) {
  const { actions } = useData()
  const s = fixture[sport]
  const [teamId, setTeamId] = useState(fixture.homeTeamId)
  const [freeText, setFreeText] = useState('')
  const [minute, setMinute] = useState(s.clock ? String(clockMinute(s.clock)) : '')
  const [cardType, setCardType] = useState('yellow')

  const team = teamId === home?.id ? home : away
  const roster = (team?.players || []).filter((p) => p.sport === sport && p.role === 'player')

  const commit = (name, playerId = null) => {
    actions.addCard(fixture.id, sport, {
      playerId, teamId, name, type: cardType, minute: minute ? Number(minute) : null,
    })
    onDone()
  }

  return (
    <div className="sd-picker">
      <div className="sd-seg">
        <button className={teamId === home?.id ? 'active' : ''} style={{ '--tc': home?.colorHex }} onClick={() => setTeamId(home.id)}>{home?.code}</button>
        <button className={teamId === away?.id ? 'active' : ''} style={{ '--tc': away?.colorHex }} onClick={() => setTeamId(away.id)}>{away?.code}</button>
      </div>
      <div className="sd-seg">
        <button className={cardType === 'yellow' ? 'active card-y' : ''} onClick={() => setCardType('yellow')}><Icon name="card" size={13} />Yellow</button>
        <button className={cardType === 'red' ? 'active card-r' : ''} onClick={() => setCardType('red')}><Icon name="card" size={13} />Red</button>
      </div>
      <input className="sd-picker-min" type="number" inputMode="numeric" placeholder="Minute (optional)"
        value={minute} onChange={(e) => setMinute(e.target.value)} />
      {roster.length > 0 ? (
        <div className="sd-picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
            </button>
          ))}
        </div>
      ) : (
        <div className="sd-picker-free">
          <input placeholder="Player name" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          <button disabled={!freeText.trim()} onClick={() => commit(freeText.trim())}>Add</button>
        </div>
      )}
      <button className="sd-picker-cancel" onClick={onDone}>Cancel</button>
    </div>
  )
}
