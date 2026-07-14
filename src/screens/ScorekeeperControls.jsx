import { useState } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { SPORT_GLYPH } from '../lib/constants'
import { cardRemainingMs, clockElapsedMs, formatClock, matchPhase, useNow } from '../lib/clock'

// Scorekeeper live-scoring panel (§8), rendered inside a fixture card only when
// role === scorekeeper. Tap-driven (§5.2): match clock, goal buttons, scorer/card
// pickers, publish/reopen. Writes go through DataProvider actions → live to all viewers.
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
  const [picker, setPicker] = useState(null) // 'scorer' | 'card' | null

  const locked = s.status === 'final'
  const anyCardTicking = (s.cards || []).some((c) => cardRemainingMs(c) > 0)
  const now = useNow(!locked && (s.clock?.running || anyCardTicking))

  if (s.status === 'upcoming') {
    return (
      <div className={`sk-sport sk-sport-${sport}`}>
        <div className="sk-head"><span>{SPORT_GLYPH[sport]} {cap(sport)}</span><span className="chip chip-upcoming">Upcoming</span></div>
        <button className="sk-start" onClick={() => actions.startSport(fixture.id, sport)}>
          ▶ Start {sport}
        </button>
      </div>
    )
  }

  return (
    <div className={`sk-sport sk-sport-${sport}`}>
      <div className="sk-head">
        <span>{SPORT_GLYPH[sport]} {cap(sport)}</span>
        {locked
          ? <span className="chip chip-final">Full-time</span>
          : <span className="badge-live"><span className="pulse" />Live</span>}
      </div>

      <MatchClock fixture={fixture} sport={sport} s={s} locked={locked} now={now} />

      <div className="score-row">
        <ScoreCell team={home} value={s.home} disabled={locked}
          onPlus={() => actions.adjustScore(fixture.id, sport, 'home', +1)}
          onMinus={() => actions.adjustScore(fixture.id, sport, 'home', -1)} />
        <ScoreCell team={away} value={s.away} disabled={locked}
          onPlus={() => actions.adjustScore(fixture.id, sport, 'away', +1)}
          onMinus={() => actions.adjustScore(fixture.id, sport, 'away', -1)} />
      </div>

      {(s.scorers?.length > 0 || s.cards?.length > 0) && (
        <div className="sk-events">
          {s.scorers.map((sc, i) => (
            <span className="ev-chip" key={`s${i}`}>⚽ {sc.name || 'Scorer'}{sc.minute ? ` ${sc.minute}'` : ''}</span>
          ))}
          {s.cards.map((c, i) => {
            const remain = cardRemainingMs(c, now)
            return (
              <span className={`ev-chip ev-card ev-card-${c.type}`} key={`c${i}`}>
                {c.type === 'red' ? '🟥' : '🟨'} {c.name || 'Player'}{c.minute ? ` ${c.minute}'` : ''}
                {remain > 0 && <b className="ev-countdown">{formatClock(remain)}</b>}
              </span>
            )
          })}
        </div>
      )}

      {!locked && (
        <>
          <div className="sk-actions">
            <button onClick={() => setPicker(picker === 'scorer' ? null : 'scorer')}>+ Scorer</button>
            <button className="sk-card-btn" onClick={() => setPicker(picker === 'card' ? null : 'card')}>+ Card</button>
            <button className="sk-publish" onClick={() => actions.publishSport(fixture.id, sport)}>Publish full-time</button>
          </div>
          {picker === 'scorer' && (
            <EventPicker kind="scorer" fixture={fixture} sport={sport} home={home} away={away}
              onDone={() => setPicker(null)} />
          )}
          {picker === 'card' && (
            <EventPicker kind="card" fixture={fixture} sport={sport} home={home} away={away}
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

const PHASE_LABEL = {
  not_started: 'NOT STARTED', first_half: '1ST HALF', halftime: 'HALF-TIME',
  second_half: '2ND HALF', paused: 'PAUSED', full_time: 'FULL-TIME',
}

function MatchClock({ fixture, sport, s, locked, now }) {
  const { actions } = useData()
  const elapsed = clockElapsedMs(s.clock, now)
  const phase = matchPhase(s.clock, locked)

  return (
    <div className="match-clock">
      <div className="mc-time">
        <span className="mc-glyph" aria-hidden="true">⏱</span>
        <span className="mc-val">{formatClock(elapsed)}</span>
        <span className="mc-phase">{PHASE_LABEL[phase]}</span>
      </div>
      {!locked && (
        <div className="mc-actions">
          {phase === 'first_half' && (
            <>
              <button className="mc-btn mc-pause" onClick={() => actions.pauseClock(fixture.id, sport)}>❚❚ Pause</button>
              <button className="mc-btn mc-half" onClick={() => actions.startHalftime(fixture.id, sport)}>Half-time</button>
            </>
          )}
          {phase === 'second_half' && (
            <button className="mc-btn mc-pause" onClick={() => actions.pauseClock(fixture.id, sport)}>❚❚ Pause</button>
          )}
          {phase === 'paused' && s.clock?.half === 1 && (
            <>
              <button className="mc-btn mc-resume" onClick={() => actions.resumeClock(fixture.id, sport)}>▶ Resume</button>
              <button className="mc-btn mc-half" onClick={() => actions.startHalftime(fixture.id, sport)}>Half-time</button>
            </>
          )}
          {phase === 'paused' && s.clock?.half === 2 && (
            <button className="mc-btn mc-resume" onClick={() => actions.resumeClock(fixture.id, sport)}>▶ Resume</button>
          )}
          {phase === 'halftime' && (
            <button className="mc-btn mc-resume" onClick={() => actions.startSecondHalf(fixture.id, sport)}>▶ Start 2nd half</button>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreCell({ team, value, onPlus, onMinus, disabled }) {
  return (
    <div className="score-cell">
      <span className="sc-label">{team?.code}</span>
      <span className="sc-val">{value}</span>
      <button
        className="goal-btn"
        style={{ background: team?.colorHex, borderColor: team?.colorHex }}
        onClick={onPlus}
        disabled={disabled}
      >
        + {team?.code} goal
      </button>
      <button className="goal-minus" onClick={onMinus} disabled={disabled || !value} aria-label={`Correct ${team?.code} score down`}>− correct</button>
    </div>
  )
}

// Scorer / card picker: choose team, then a roster player (or free-text if the
// roster isn't loaded yet, §8). Cards also choose yellow/red.
function EventPicker({ kind, fixture, sport, home, away, onDone }) {
  const { actions } = useData()
  const [teamId, setTeamId] = useState(fixture.homeTeamId)
  const [freeText, setFreeText] = useState('')
  const [minute, setMinute] = useState('')
  const [cardType, setCardType] = useState('yellow')

  const team = teamId === home?.id ? home : away
  const roster = (team?.players || []).filter((p) => p.sport === sport && p.role === 'player')

  const commit = (name, playerId = null) => {
    const minNum = minute ? Number(minute) : null
    if (kind === 'scorer') {
      actions.addScorer(fixture.id, sport, { playerId, teamId, name, minute: minNum })
    } else {
      actions.addCard(fixture.id, sport, { playerId, teamId, name, type: cardType, minute: minNum })
    }
    onDone()
  }

  return (
    <div className="picker">
      <div className="segmented" style={{ marginBottom: 10 }}>
        <button className={teamId === home?.id ? 'active' : ''} onClick={() => setTeamId(home.id)}>{home?.code}</button>
        <button className={teamId === away?.id ? 'active' : ''} onClick={() => setTeamId(away.id)}>{away?.code}</button>
      </div>

      {kind === 'card' && (
        <div className="segmented" style={{ marginBottom: 10 }}>
          <button className={cardType === 'yellow' ? 'active' : ''} onClick={() => setCardType('yellow')}>🟨 Yellow</button>
          <button className={cardType === 'red' ? 'active' : ''} onClick={() => setCardType('red')}>🟥 Red</button>
        </div>
      )}

      <input className="picker-min" type="number" inputMode="numeric" placeholder="Min (optional)"
        value={minute} onChange={(e) => setMinute(e.target.value)} />

      {roster.length > 0 ? (
        <div className="picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
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
