import { useState } from 'react';
import { useFixtures } from '../hooks/useFixtures.js';
import { useTeams } from '../hooks/useTeams.js';
import { useRole } from '../contexts/RoleContext.jsx';
import MatchCard from '../components/MatchCard.jsx';
import { generateMancoReport } from '../utils/report.js';
import { useTravel } from '../hooks/useTravel.js';

const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'nsd2026';

export default function FixturesTab() {
  const fixtures = useFixtures(EVENT_ID);
  const teams = useTeams(EVENT_ID);
  const travel = useTravel(EVENT_ID);
  const { isScorekeeper } = useRole();
  const [sport, setSport] = useState('all');
  const [generating, setGenerating] = useState(false);

  const filtered = fixtures; // all fixtures shown, sport filter only for display

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      await generateMancoReport({ fixtures, teams, travel });
    } catch (e) {
      console.error('Report error:', e);
      alert('Failed to generate report: ' + e.message);
    }
    setGenerating(false);
  }

  const isLive = (f) => f.soccer?.status === 'live' || f.netball?.status === 'live';

  return (
    <div>
      {isScorekeeper && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            className="btn btn-outline btn-block"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? 'Generating…' : '📄 Generate MANCO Report'}
          </button>
        </div>
      )}

      <div className="seg-ctrl" style={{ marginTop: 12 }}>
        <button className={`seg-btn${sport === 'all' ? ' active' : ''}`} onClick={() => setSport('all')}>All</button>
        <button className={`seg-btn${sport === 'soccer' ? ' active' : ''}`} onClick={() => setSport('soccer')}>⚽ Soccer</button>
        <button className={`seg-btn${sport === 'netball' ? ' active' : ''}`} onClick={() => setSport('netball')}>🏐 Netball</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No fixtures loaded</div>
          <div className="empty-state-sub">Fixtures will appear once data is seeded</div>
        </div>
      ) : (
        filtered.map((f) => (
          <MatchCard
            key={f.id}
            fixture={f}
            teams={teams}
            sport={sport === 'all' ? null : sport}
            canScore={isScorekeeper && isLive(f)}
          />
        ))
      )}
    </div>
  );
}
