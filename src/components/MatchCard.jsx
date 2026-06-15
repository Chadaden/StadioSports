import { useState } from 'react';
import { doc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useRole } from '../contexts/RoleContext.jsx';
import TeamBadge from './TeamBadge.jsx';

function roundLabel(round) {
  if (round === 'roundRobin') return 'Group Stage';
  if (round === 'playoff') return '3rd/4th Playoff';
  if (round === 'final') return 'Final';
  return round;
}

function statusBadge(status) {
  if (status === 'live') return <span className="badge badge-live">● Live</span>;
  if (status === 'final') return <span className="badge badge-ft">Full Time</span>;
  return <span className="badge badge-upcoming">Upcoming</span>;
}

function SportScoreRow({ label, sport, fixture, canScore }) {
  const s = fixture[sport] || {};
  const eventId = import.meta.env.VITE_EVENT_ID || 'nsd2026';
  const fixtureRef = doc(db, `events/${eventId}/fixtures/${fixture.id}`);

  async function adj(side, delta) {
    await updateDoc(fixtureRef, { [`${sport}.${side}`]: increment(delta) });
  }

  async function setLive() {
    await updateDoc(fixtureRef, { [`${sport}.status`]: 'live' });
  }

  async function setFinal() {
    await updateDoc(fixtureRef, { [`${sport}.status`]: 'final' });
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="hero-sport-label">{label === 'soccer' ? '⚽ Soccer' : '🏐 Netball'}</span>
        {statusBadge(s.status)}
      </div>
      <div className="match-score-pair">
        <span className="match-score-num">{s.home ?? 0}</span>
        <span className="match-score-dash">–</span>
        <span className="match-score-num">{s.away ?? 0}</span>
      </div>
      {(s.scorers || []).length > 0 && (
        <div style={{ marginTop: 4 }}>
          {(s.scorers || []).map((sc, i) => (
            <span key={i} className="event-chip chip-scorer">⚽ {typeof sc === 'string' ? sc : sc.name}</span>
          ))}
        </div>
      )}
      {(s.cards || []).length > 0 && (
        <div style={{ marginTop: 2 }}>
          {(s.cards || []).map((c, i) => (
            <span key={i} className={`event-chip ${c.colour === 'yellow' ? 'chip-yellow' : 'chip-red'}`}>
              {c.colour === 'yellow' ? '🟨' : '🟥'} {typeof c === 'string' ? c : c.name}
              {c.minute ? ` ${c.minute}'` : ''}
            </span>
          ))}
        </div>
      )}

      {canScore && (
        <ScoringControls
          sport={sport}
          fixture={fixture}
          s={s}
          onAdj={adj}
          onSetLive={setLive}
          onSetFinal={setFinal}
          fixtureRef={fixtureRef}
        />
      )}
    </div>
  );
}

function ScoringControls({ sport, fixture, s, onAdj, onSetLive, onSetFinal, fixtureRef }) {
  const [scorerName, setScorerName] = useState('');
  const [scorerTeam, setScorerTeam] = useState('home');
  const [cardName, setCardName] = useState('');
  const [cardTeam, setCardTeam] = useState('home');
  const [cardColour, setCardColour] = useState('yellow');
  const [cardMinute, setCardMinute] = useState('');

  async function addScorer() {
    if (!scorerName.trim()) return;
    const teamId = scorerTeam === 'home' ? fixture.homeTeamId : fixture.awayTeamId;
    await updateDoc(fixtureRef, {
      [`${sport}.scorers`]: arrayUnion({ name: scorerName.trim(), team: teamId }),
      [`${sport}.${scorerTeam}`]: increment(1),
    });
    setScorerName('');
  }

  async function addCard() {
    if (!cardName.trim()) return;
    const teamId = cardTeam === 'home' ? fixture.homeTeamId : fixture.awayTeamId;
    await updateDoc(fixtureRef, {
      [`${sport}.cards`]: arrayUnion({
        name: cardName.trim(),
        team: teamId,
        colour: cardColour,
        minute: cardMinute,
      }),
    });
    setCardName('');
    setCardMinute('');
  }

  return (
    <div className="scoring-panel">
      <div className="scoring-panel-title">Score Controls</div>

      <div className="scoring-row">
        <span className="scoring-label">Home</span>
        <div className="stepper">
          <button className="step-btn" onClick={() => onAdj('home', -1)}>−</button>
          <span className="step-val">{s.home ?? 0}</span>
          <button className="step-btn" onClick={() => onAdj('home', 1)}>+</button>
        </div>
      </div>
      <div className="scoring-row">
        <span className="scoring-label">Away</span>
        <div className="stepper">
          <button className="step-btn" onClick={() => onAdj('away', -1)}>−</button>
          <span className="step-val">{s.away ?? 0}</span>
          <button className="step-btn" onClick={() => onAdj('away', 1)}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {s.status === 'upcoming' && (
          <button className="btn btn-lime" style={{ fontSize: 13, padding: '8px 14px' }} onClick={onSetLive}>
            Start Match
          </button>
        )}
        {s.status === 'live' && (
          <button className="btn btn-red" style={{ fontSize: 13, padding: '8px 14px' }} onClick={onSetFinal}>
            Publish Full Time
          </button>
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <div className="scoring-panel-title">+ Scorer</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input
            className="text-input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="Player name"
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
          />
          <select className="select-ctrl" value={scorerTeam} onChange={(e) => setScorerTeam(e.target.value)}>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={addScorer}>Add</button>
        </div>
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <div className="scoring-panel-title">+ Card</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input
            className="text-input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="Player name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
          <select className="select-ctrl" value={cardTeam} onChange={(e) => setCardTeam(e.target.value)}>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
          <select className="select-ctrl" value={cardColour} onChange={(e) => setCardColour(e.target.value)}>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
          <input
            className="text-input"
            style={{ width: 60 }}
            placeholder="Min"
            value={cardMinute}
            onChange={(e) => setCardMinute(e.target.value)}
          />
          <button className="btn btn-orange" style={{ padding: '8px 14px', fontSize: 13 }} onClick={addCard}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default function MatchCard({ fixture, teams, sport = null, canScore = false }) {
  if (!fixture) return null;
  const homeTeam = teams[fixture.homeTeamId];
  const awayTeam = teams[fixture.awayTeamId];

  const soccerStatus = fixture.soccer?.status || 'upcoming';
  const netballStatus = fixture.netball?.status || 'upcoming';
  const overallLive = soccerStatus === 'live' || netballStatus === 'live';

  return (
    <div className="match-card">
      <div className="match-card-header">
        <span className="match-time">{fixture.slotTime}</span>
        <span className="match-round">{roundLabel(fixture.round)}</span>
        {overallLive && <span className="badge badge-live">● Live</span>}
      </div>
      <div className="match-body">
        <div className="match-teams">
          <div className="match-team">
            {homeTeam ? <TeamBadge team={homeTeam} /> : <span className="match-team-name">{fixture.homeTeamId === 'tbd' ? 'TBD' : fixture.homeTeamId}</span>}
          </div>
          <div className="match-score-area">
            {(!sport || sport === 'soccer') && (
              <SportScoreRow label="soccer" sport="soccer" fixture={fixture} canScore={canScore} />
            )}
            {(!sport || sport === 'netball') && (
              <SportScoreRow label="netball" sport="netball" fixture={fixture} canScore={canScore} />
            )}
          </div>
          <div className="match-team">
            {awayTeam ? <TeamBadge team={awayTeam} /> : <span className="match-team-name">{fixture.awayTeamId === 'tbd' ? 'TBD' : fixture.awayTeamId}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
