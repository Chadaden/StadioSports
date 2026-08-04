// Stardial scorekeeper panel — designed like a hardware remote: one glance,
// one thumb. Icon-free: labels are words, "+" is typography, card colour is
// spelled out. Soccer goals log instantly with an unknown scorer and are
// attributed afterwards (§5); netball keeps direct +/- scoring. Classic
// (screens/ScorekeeperControls.jsx) remains untouched, dead code.

import { useState } from 'react'
import { useData, useTeamMap } from '../../store/DataProvider'
import {
  PHASE_LABELS, clockMinute, formatClock, isClockRunning, useSecondTick,
} from '../../lib/clock'
import {
  canPublishSport, canStartSecondHalf, formatDurationSeconds, isAlarmActive, sinBinRemainingSeconds, sportHomeAwayIds,
} from '../../lib/matchState'
import { LivePill, ScorePop } from './bits'

export default function SdSkControls({ fixture }) {
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
  // Round-robin fixtures share the fixed printed pairing; the playoff/final
  // slots (§8) can seat different teams per sport once auto-populated.
  const { homeTeamId, awayTeamId } = sportHomeAwayIds(fixture, sport)
  const home = teams[homeTeamId]
  const away = teams[awayTeamId]
  const [picker, setPicker] = useState(null) // { kind:'attribute', index } | { kind:'card' } | null
  // Two-tap in-app confirm for Reset/Publish (replaces window.confirm, which
  // silently no-ops on tablet/PWA contexts that suppress native dialogs).
  const [armed, setArmed] = useState(null) // 'reset' | 'publish' | null
  const [publishError, setPublishError] = useState(null)
  const running = isClockRunning(s.clock)
  const hasActiveSinBin = (s.cards || []).some((card) => sinBinRemainingSeconds(card) > 0)
  const now = useSecondTick(running || hasActiveSinBin)
  const alarmActive = isAlarmActive(s.clock, now)
  const publishReady = canPublishSport(s, now)
  const secondHalfReady = canStartSecondHalf(s, now)
  const alarmLabel = s.clock?.phase === 'h2' ? 'FULL-TIME — PAUSE NOW' : 'HALFTIME — PAUSE NOW'

  if (!homeTeamId || !awayTeamId) {
    return (
      <div className={`sd-remote sd-remote-${sport}`}>
        <div className="sd-remote-head">
          <span className="sd-remote-sport">{sport}</span>
        </div>
        <div className="sd-sk-note">Teams set on the day from the standings.</div>
      </div>
    )
  }

  if (s.status === 'upcoming') {
    return (
      <div className={`sd-remote sd-remote-${sport}`}>
        <div className="sd-remote-head">
          <span className="sd-remote-sport">{sport}</span>
          <span className="sd-tag">UPCOMING</span>
        </div>
        <button className="sd-kickoff" onClick={() => actions.startSport(fixture.id, sport)}>
          <b>Start {sport} match</b>
          <small>timer stays stopped</small>
        </button>
      </div>
    )
  }

  const locked = s.status === 'final'
  // Instant goal logging (§5): the tap itself is the whole write — score moves
  // and an "unknown scorer" entry is logged in the same action, both live
  // immediately. Attributing a name is a separate step afterwards (below),
  // never something that blocks or delays this tap.
  const logGoal = (side) => {
    const team = side === 'home' ? home : away
    actions.addGoal(fixture.id, sport, side, {
      playerId: null, teamId: team?.id ?? null, name: null,
      minute: s.clock ? clockMinute(s.clock) : null,
    })
  }

  return (
    <div className={`sd-remote sd-remote-${sport}${locked ? ' is-locked' : ''}${alarmActive && !locked ? ' is-alarm' : ''}`}>
      <div className="sd-remote-head">
        <span className="sd-remote-sport">{sport}</span>
        {locked ? <span className="sd-tag sd-tag-final">FULL-TIME</span> : <LivePill />}
      </div>

      {s.clock && (
        <>
          <div className="sd-clockbox">
            <div className="sd-clockreadout">
              <b className="sd-clockbox-time">{formatClock(s.clock, now)}</b>
              <span className="sd-clockbox-phase">{(PHASE_LABELS[s.clock.phase] || '').toUpperCase()}</span>
            </div>
            {!locked && (
              <div className="sd-clockactions">
                {running ? (
                  <button className="sd-clockbtn hold" onClick={() => actions.pauseClock(fixture.id, sport)}>Pause</button>
                ) : s.clock.phase === 'h1' && !s.clock.baseSeconds ? (
                  <button className="sd-clockbtn go" onClick={() => actions.startClock(fixture.id, sport)}>Start timer</button>
                ) : s.clock.phase !== 'ht' ? (
                  <button className="sd-clockbtn go" onClick={() => actions.resumeClock(fixture.id, sport)}>Resume</button>
                ) : null}
                {secondHalfReady && (
                  <button className="sd-clockbtn half" onClick={() => actions.startSecondHalf(fixture.id, sport)}>Second half</button>
                )}
                {armed === 'reset' ? (
                  <>
                    <button className="sd-clockbtn reset is-armed"
                      onClick={() => { actions.resetClock(fixture.id, sport); setArmed(null) }}>
                      Confirm reset
                    </button>
                    <button className="sd-clockbtn cancel" onClick={() => setArmed(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="sd-clockbtn reset" onClick={() => setArmed('reset')}>Reset</button>
                )}
              </div>
            )}
          </div>
          {alarmActive && !locked && <div className="sd-alarm">{alarmLabel}</div>}
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
                  onClick={() => logGoal(side)}>
                  <b>+ Goal</b>
                  <small>{team?.name}</small>
                </button>
                {sport === 'netball' && (
                  <button className="sd-goalremove" disabled={!s[side]}
                    onClick={() => actions.removeLatestGoal(fixture.id, sport, side)}>− Remove goal</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {picker?.kind === 'attribute' && (
        <AttributePicker
          fixture={fixture} sport={sport} index={picker.index}
          team={teams[s.scorers[picker.index]?.teamId]}
          onDone={() => setPicker(null)}
        />
      )}

      {(s.scorers?.length > 0 || s.cards?.length > 0) && (
        <div className="sd-events">
          {s.scorers.map((sc, i) => (
            <span className={`sd-ev sd-ev-scorer${sc.name == null ? ' is-unattributed' : ''}`}
              key={`s${i}`} style={{ '--tc': teams[sc.teamId]?.colorHex }}>
              {locked ? (
                <span className="sd-ev-label">{sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Goal'}</span>
              ) : (
                <button className="sd-ev-label" onClick={() => setPicker({ kind: 'attribute', index: i })}>
                  {sc.minute ? `${sc.minute}' ` : ''}{sc.name || 'Who scored?'}
                </button>
              )}
              {!locked && (
                <button className="sd-ev-x" aria-label="Remove goal"
                  onClick={() => actions.removeGoal(fixture.id, sport, i)}>×</button>
              )}
            </span>
          ))}
          {s.cards.map((c, i) => {
            const remaining = sinBinRemainingSeconds(c, now)
            return (
              <span className={`sd-ev sd-ev-${c.type}`} key={`c${i}`}>
                <b className="sd-ev-kind">{c.type === 'red' ? 'Red' : 'Yellow'}</b>
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
              + Card
            </button>
            {publishReady && (
              armed === 'publish' ? (
                <>
                  <button className="sd-publish is-armed" onClick={() => {
                    setPublishError(null)
                    Promise.resolve(actions.publishSport(fixture.id, sport))
                      .then(() => setArmed(null))
                      .catch((err) => setPublishError(err?.message || 'Publish failed — try again.'))
                  }}>
                    Confirm & lock score
                  </button>
                  <button className="sd-cardbtn" onClick={() => { setArmed(null); setPublishError(null) }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="sd-publish" onClick={() => setArmed('publish')}>
                  Publish full-time
                </button>
              )
            )}
          </div>
          {publishError && <div className="sd-sk-note sd-publish-error">{publishError}</div>}
          {picker?.kind === 'card' && (
            <CardPicker fixture={fixture} sport={sport} home={home} away={away}
              onDone={() => setPicker(null)} />
          )}
        </>
      )}

      {locked && (
        <button className="sd-reopen" onClick={() => actions.reopenSport(fixture.id, sport)}>Reopen match</button>
      )}
    </div>
  )
}

// Attribution flow (§5): the goal already went live on tap — this only fills
// in who scored, editing that one scorers[] entry in place. Never creates a
// goal or touches the score, so it's just as fine to cancel out of as to
// finish — the score was never waiting on it.
function AttributePicker({ fixture, sport, index, team, onDone }) {
  const { actions } = useData()
  const roster = (team?.players || []).filter((p) => p.sport === sport && p.role === 'player')
  const [freeText, setFreeText] = useState('')

  const commit = (name, playerId = null) => {
    actions.attributeScorer(fixture.id, sport, index, { playerId, name })
    onDone()
  }

  return (
    <div className="sd-picker">
      <div className="sd-picker-title" style={{ '--tc': team?.colorHex }}>
        <b>{team?.code}</b> goal — who scored?
      </div>
      {roster.length > 0 ? (
        <div className="sd-picker-list">
          {roster.map((p) => (
            <button key={p.id} onClick={() => commit(`${p.firstName} ${p.surname}`, p.id)}>
              {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.surname}{p.isGK ? ' (GK)' : ''}
            </button>
          ))}
          <button className="sd-picker-unknown" onClick={() => commit('Unknown scorer')}>Unknown / own goal</button>
        </div>
      ) : (
        <div className="sd-picker-free">
          <input placeholder="Player name" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          <button onClick={() => commit(freeText.trim() || 'Unknown scorer')}>Add</button>
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
  const [teamId, setTeamId] = useState(home?.id)
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
        <button className={cardType === 'yellow' ? 'active card-y' : ''} onClick={() => setCardType('yellow')}>Yellow</button>
        <button className={cardType === 'red' ? 'active card-r' : ''} onClick={() => setCardType('red')}>Red</button>
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
