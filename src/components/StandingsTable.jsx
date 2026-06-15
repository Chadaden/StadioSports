import TeamBadge from './TeamBadge.jsx';

export default function StandingsTable({ rows, teams }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-text">No results yet</div>
        <div className="empty-state-sub">Standings will update as matches finish</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: 'left' }}>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId} className={i === 0 ? 'leader' : ''}>
              <td>
                <span className="standings-rank">{i + 1}</span>
              </td>
              <td>
                {teams[r.teamId] ? (
                  <TeamBadge team={teams[r.teamId]} />
                ) : (
                  r.teamId
                )}
              </td>
              <td>{r.P}</td>
              <td>{r.W}</td>
              <td>{r.D}</td>
              <td>{r.L}</td>
              <td>{r.GF}</td>
              <td>{r.GA}</td>
              <td>{r.GD > 0 ? `+${r.GD}` : r.GD}</td>
              <td style={{ fontWeight: 700 }}>{r.Pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
