import { useState } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { SPORT_GLYPH } from '../lib/constants'
import {
  PHASE_LABELS, clockMinute, formatClock, isClockRunning, useFirstHalfAlert, useSecondTick,
} from '../lib/clock'
import { formatDurationSeconds, sinBinRemainingSeconds } from '../lib/matchState'

// Scorekeeper live-scoring panel (§8), rendered inside a fixture card only when
// role === scorekeeper. Tap-driven (§5.2). Format per the sheet: 20-minute
// games, 2 × 10-minute halves. Match activation and timer start are separate;
// a soccer goal tap
// captures the clock minute and opens the roster picker for that side, so
// "20' Jones" lands on every spectator's screen in one flow.
export default function ScorekeeperControls({ fixture }) {
  // Bracket fixtures (playoff/final) have no teams until the day — skip.
  if (!fixture.homeTeamId || !fixture.awayTeamId) {
    return <div className="sk-note muted">Teams set on the day from the standings.</div>
  }
  return (
    <div className="sk-panel">
      {['soccer', 'netball'].map((sport) => (
        <SportControls key={sport} fixture={fixture} sport={sport} />
      ))}
    </div>
  )
}

function SportControls({ fixture, sport }) {
  const { actions } = useData()
  const teams = useTeamMap()
  const s = fixture[sport]
  const home = teams[fixture.homeTeamId]
  const away = teams[fixture.awayTeamId]
  // picker: { kind: 'goal', side, minute } | { kind: 'card' } | null
  const [picker, setPicker] = useState(null)
  const running = isClockRunning(s.clock)
  const hasActiveSinBin = (s.cards || []).some((card) => sinBinRemainingSeconds(card) > 0)
  const now = useSecondTick(running || hasActiveSinBin)
  const firstHalfReached = useFirstHalfAlert(s.clock, now)

  if (s.status === 'upcoming') {
    return (
      <div className={`sk-sport sk-sport-${sport}`}>
        <div className="sk-head"><span>{SPORT_GLYPH[sport]} {cap(sport)}</span><span className="chip chip-upcoming">Upcoming</span></div>
        <button className="sk-start" onClick={() => actions.startSport(fixture.id, sport)}>
          Open {sport} controls — timer stays stopped
        </button>
      </div>
    )
  }

  const locked = s.status === 'final'
  // Event handler — reads the real clock at tap time, not the 1s render tick.
  const openGoalPicker = (side) =>
    setPicker({ kind: 'goal', side, minute: s.clock ? clockMinute(s.clock) : null })

  return (
    <div className={`sk-sport sk-sport-${sport}`}>
      <div className="sk-head">
        <span>{SPORT_GLYPH[sport]} {cap(sport)}</span>
        {locked
          ? <span className="chip chip-final">Full-time</span>
          : <span className="badge-live"><span className="pulse" />Live</span>}
      </div>

      {s.clock && (
        <>
          <div className="sk-clock">
            <span className="sk-clock-time">⏱ {formatClock(s.clock, now)}</span>
            <span className="sk-clock-phase">{PHASE_LABELS[s.clock.phase] || ''}</span>
            {!locked && (
              <div className="sk-clock-actions">
                {running ? (
                  <button className="sk-clock-btn" onClick={() => actions.pauseClock(fixture.id, sport)}>⏸ Pause timer</button>
                ) : s.clock.phase === 'h1' && !s.clock.baseSeconds ? (
                  <button className="sk-clock-btn resume" onClick={() => actions.startClock(fixture.id, sport)}>▶ Start timer</button>
                ) : s.clock.phase !== 'ht' ? (
                  <button className="sk-clock-btn resume" onClick={() => actions.resumeClock(fixture.id, sport)}>▶ Resume timer</button>
                ) : null}
                {!running && (s.clock.phase === 'ht' || (s.clock.phase === 'h1' && s.clock.baseSeconds > 0)) && (
                  <button className="sk-clock-btn second-half" onClick={() => actions.startSecondHalf(fixture.id, sport)}>▶ Start second half</button>
                )}
                <button className="sk-clock-btn reset" onClick={() => {
                  if (window.confirm('Reset this timer to 0:00 and the first half? Scores and events will remain.')) {
                    actions.resetClock(fixture.id, sport)
                  }
                }}>↺ Reset</button>
              </div>
            )}
          </div>
          {firstHalfReached && !locked && <div className="sk-half-alert">First half has reached 10:00 — pause when the whistle goes.</div>}
        </>
      )}

      <div className="sk-scoreline">
        <span>{home?.code}</span>
        <span className="sk-score">{s.home}<span className="dash">–</span>{s.away}</span>
        <span>{away?.code}</span>
      </div>

      {!locked && (
        <div className="sk-goal-row">
          {['home', 'away'].map((side) => {
            const team = side === 'home' ? home : away
            return (
              <div className="sk-goal-team" key={side}>
                <button className="sk-goal" style={{ background: team?.colorHex }}
                  onClick={() => sport === 'netball'
                    ? actions.adjustScore(fixture.id, sport, side, 1)
                    : openGoalPicker(side)}>
                  + {SPORT_GLYPH[sport]} {team?.code} goal
                </button>
                {sport === 'netball' && (
                  <button className="sk-goal-remove" disabled={!s[side]}
                    onClick={() => actions.adjustScore(fixture.id, sport, side, -1)}>
                    − Remove goal
                  </button>
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
        <div className="sk-events">
          {s.scorers.map((sc, i) => (
            <span className="ev-chip" key={`s${i}`}>
              {SPORT_GLYPH[sport]} {sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}
              {!locked && (
                <button
                  className="ev-x" aria-label="Remove goal"
                  onClick={() => actions.removeGoal(fixture.id, sport, i)}
                >✕</button>
              )}
            </span>
          ))}
          {s.cards.map((c, i) => {
            const remaining = sinBinRemainingSeconds(c, now)
            return (
              <span className={`ev-chip ev-card-${c.type}`} key={`c${i}`}>
                {c.type === 'red' ? '🟥' : '🟨'} {c.minute ? `${c.minute}' ` : ''}{c.name || 'Player'}
                <b className="ev-countdown">{remaining ? formatDurationSeconds(remaining) : 'served'}</b>
              </span>
            )
          })}
        </div>
      )}

      {!locked && (
        <>
          <div className="sk-actions">
            <button className="sk-card-btn" onClick={() => setPicker(picker?.kind === 'card' ? null : { kind: 'card' })}>+ Card</button>
            <button className="sk-publish" onClick={() => actions.publishSport(fixture.id, sport)}>Publish full-time</button>
          </div>
          {picker?.kind === 'card' && (
            <CardPicker fixture={fixture} sport={sport} home={home} away={away}
              onDone={() => setPicker(null)} />
          )}
        </>
      )}

      {locked && (
        <button className="sk-reopen" onClick={() => actions.reopenSport(fixture.id, sport)}>Reopen match</button>
      )}
    </div>
  )
}

// Goal flow: minute is already captured from the clock — just pick who scored.
// Only that side's roster for this sport is offered (§8).
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
    <div className="picker">
      <div className="picker-title">
        {SPORT_GLYPH[sport]} Goal — {team?.code}{minute ? ` · ${minute}'` : ''} · who scored?
      </div>
      {roster.length > 0 ? (
        <div className="picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
            </button>
          ))}
          <button className="picker-unknown" onClick={() => commit(null)}>Unknown / own goal</button>
        </div>
      ) : (
        <div className="picker-free">
          <input placeholder="Player name" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          <button onClick={() => commit(freeText.trim() || null)}>Add</button>
        </div>
      )}
      <button className="picker-cancel" onClick={onDone}>Cancel</button>
    </div>
  )
}

// Card picker: choose team, yellow/red, then a roster player (or free-text if
// the roster isn't loaded, §8). Minute prefills from the match clock.
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
    <div className="picker">
      <div className="segmented" style={{ marginBottom: 10 }}>
        <button className={teamId === home?.id ? 'active' : ''} onClick={() => setTeamId(home.id)}>{home?.code}</button>
        <button className={teamId === away?.id ? 'active' : ''} onClick={() => setTeamId(away.id)}>{away?.code}</button>
      </div>

      <div className="segmented" style={{ marginBottom: 10 }}>
        <button className={cardType === 'yellow' ? 'active' : ''} onClick={() => setCardType('yellow')}>🟨 Yellow</button>
        <button className={cardType === 'red' ? 'active' : ''} onClick={() => setCardType('red')}>🟥 Red</button>
      </div>

      <input className="picker-min" type="number" inputMode="numeric" placeholder="Min (optional)"
        value={minute} onChange={(e) => setMinute(e.target.value)} />

      {roster.length > 0 ? (
        <div className="picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
            </button>
          ))}
        </div>
      ) : (
        <div className="picker-free">
          <input placeholder="Player name" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          <button disabled={!freeText.trim()} onClick={() => commit(freeText.trim())}>Add</button>
        </div>
      )}

      <button className="picker-cancel" onClick={onDone}>Cancel</button>
    </div>
  )
}

const cap = (w) => w[0].toUpperCase() + w.slice(1)
