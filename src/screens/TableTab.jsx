import { useState } from 'react';
import { useFixtures } from '../hooks/useFixtures.js';
import { useTeams } from '../hooks/useTeams.js';
import { computeStandings } from '../utils/standings.js';
import StandingsTable from '../components/StandingsTable.jsx';

const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'nsd2026';

export default function TableTab() {
  const fixtures = useFixtures(EVENT_ID);
  const teams = useTeams(EVENT_ID);
  const [sport, setSport] = useState('soccer');

  const teamIds = Object.keys(teams);
  const standings = teamIds.length > 0 ? computeStandings(fixtures, teamIds) : { soccer: [], netball: [] };

  return (
    <div>
      <div className="seg-ctrl" style={{ marginTop: 12 }}>
        <button className={`seg-btn${sport === 'soccer' ? ' active' : ''}`} onClick={() => setSport('soccer')}>
          ⚽ Soccer
        </button>
        <button className={`seg-btn${sport === 'netball' ? ' active' : ''}`} onClick={() => setSport('netball')}>
          🏐 Netball
        </button>
      </div>

      <div className="card" style={{ padding: '8px 12px', overflow: 'hidden' }}>
        <StandingsTable rows={standings[sport]} teams={teams} />
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <div className="card-sm" style={{ margin: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-soft)', marginBottom: 6 }}>
            Points Rules
          </div>
          {sport === 'soccer' ? (
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.7 }}>
              Win = 3 pts · Draw = 1 pt · Loss = 0 pts<br />
              Tiebreaker: Points → Goal Difference → Head-to-Head
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.7 }}>
              Win = 2 pts · Draw = 1 pt · Loss = 0 pts<br />
              Tiebreaker: Points → Goal Difference → Head-to-Head
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
