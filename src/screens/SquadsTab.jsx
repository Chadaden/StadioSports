import { useState } from 'react';
import { usePlayers } from '../hooks/usePlayers.js';
import { useTeams } from '../hooks/useTeams.js';

const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'nsd2026';

const TEAM_ORDER = ['centurion', 'musgrave', 'durbanville', 'waterfall'];

function RoleBadge({ role }) {
  const cls = { player: 'role-player', support: 'role-support', hoc: 'role-hoc' }[role] || 'role-player';
  const label = { player: 'Player', support: 'Support', hoc: 'HOC' }[role] || role;
  return <span className={`role-badge ${cls}`}>{label}</span>;
}

function TeamSquad({ teamId, team }) {
  const allPlayers = usePlayers(teamId, EVENT_ID);
  const [sport, setSport] = useState('soccer');

  if (!team?.rosterLoaded) {
    return (
      <div className="empty-state" style={{ padding: '32px 16px' }}>
        <div className="empty-state-icon">⏳</div>
        <div className="empty-state-text">Roster Pending</div>
        <div className="empty-state-sub">The squad for {team?.name || teamId} will be published before the event</div>
      </div>
    );
  }

  const players = allPlayers.filter((p) => p.sport === sport || p.sport === 'all');

  return (
    <div>
      <div className="seg-ctrl" style={{ marginTop: 8 }}>
        <button className={`seg-btn${sport === 'soccer' ? ' active' : ''}`} onClick={() => setSport('soccer')}>
          ⚽ Soccer
        </button>
        <button className={`seg-btn${sport === 'netball' ? ' active' : ''}`} onClick={() => setSport('netball')}>
          🏐 Netball
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {players.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-text">No players in this category</div>
          </div>
        ) : (
          players.map((p) => (
            <div key={p.id} className="squad-player-row">
              <span className="squad-player-name">{p.firstName} {p.surname}</span>
              <div className="squad-player-badges">
                <RoleBadge role={p.role} />
                {p.isGK && <span className="role-badge role-gk">GK</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SquadsTab({ onBack }) {
  const teams = useTeams(EVENT_ID);
  const [activeTeam, setActiveTeam] = useState('centurion');

  const orderedTeams = TEAM_ORDER.filter((tid) => teams[tid]);
  const team = teams[activeTeam];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0' }}>
        <button className="btn btn-ghost" style={{ padding: '6px 0' }} onClick={onBack}>
          ← Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Squads</span>
      </div>

      <div className="pill-tabs">
        {orderedTeams.map((tid) => {
          const t = teams[tid];
          return (
            <button
              key={tid}
              className={`pill-tab${activeTeam === tid ? ' active' : ''}`}
              onClick={() => setActiveTeam(tid)}
              style={activeTeam === tid ? { background: t?.colorHex, borderColor: t?.colorHex } : {}}
            >
              {t?.name || tid}
            </button>
          );
        })}
      </div>

      <TeamSquad teamId={activeTeam} team={team} />
    </div>
  );
}
