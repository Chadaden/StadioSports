import { useState } from 'react'
import { useData, useTeamMap } from '../store/DataProvider'
import { SPORT_GLYPH } from '../lib/constants'

// Scorekeeper live-scoring panel (§8), rendered inside a fixture card only when
// role === scorekeeper. Tap-driven (§5.2): +/- steppers, scorer/card pickers,
// publish/reopen. Writes go through DataProvider actions → live to all viewers.
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

  if (s.status === 'upcoming') {
    return (
      <div className="sk-sport">
        <div className="sk-head"><span>{SPORT_GLYPH[sport]} {cap(sport)}</span><span className="chip chip-upcoming">Upcoming</span></div>
        <button className="sk-start" onClick={() => actions.startSport(fixture.id, sport)}>
          ▶ Start {sport}
        </button>
      </div>
    )
  }

  const locked = s.status === 'final'

  return (
    <div className="sk-sport">
      <div className="sk-head">
        <span>{SPORT_GLYPH[sport]} {cap(sport)}</span>
        {locked
          ? <span className="chip chip-final">Full-time</span>
          : <span className="badge-live"><span className="pulse" />Live</span>}
      </div>

      <div className="stepper-row">
        <Stepper label={home?.code} value={s.home} disabled={locked}
          onMinus={() => actions.adjustScore(fixture.id, sport, 'home', -1)}
          onPlus={() => actions.adjustScore(fixture.id, sport, 'home', +1)} />
        <Stepper label={away?.code} value={s.away} disabled={locked}
          onMinus={() => actions.adjustScore(fixture.id, sport, 'away', -1)}
          onPlus={() => actions.adjustScore(fixture.id, sport, 'away', +1)} />
      </div>

      {(s.scorers?.length > 0 || s.cards?.length > 0) && (
        <div className="sk-events">
          {s.scorers.map((sc, i) => (
            <span className="ev-chip" key={`s${i}`}>⚽ {sc.name || 'Scorer'}{sc.minute ? ` ${sc.minute}'` : ''}</span>
          ))}
          {s.cards.map((c, i) => (
            <span className="ev-chip" key={`c${i}`}>{c.type === 'red' ? '🟥' : '🟨'} {c.name || 'Player'}{c.minute ? ` ${c.minute}'` : ''}</span>
          ))}
        </div>
      )}

      {!locked && (
        <>
          <div className="sk-actions">
            <button onClick={() => setPicker(picker === 'scorer' ? null : 'scorer')}>+ Scorer</button>
            <button onClick={() => setPicker(picker === 'card' ? null : 'card')}>+ Card</button>
            <button className="sk-publish" onClick={() => actions.publishSport(fixture.id, sport)}>Publish</button>
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

function Stepper({ label, value, onMinus, onPlus, disabled }) {
  return (
    <div className="stepper">
      <span className="st-label">{label}</span>
      <div className="st-controls">
        <button onClick={onMinus} disabled={disabled} aria-label={`${label} minus`}>−</button>
        <span className="st-val">{value}</span>
        <button onClick={onPlus} disabled={disabled} aria-label={`${label} plus`}>+</button>
      </div>
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
