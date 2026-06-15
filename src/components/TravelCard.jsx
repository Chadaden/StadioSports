import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useRole } from '../contexts/RoleContext.jsx';

const TRAVEL_MILESTONES = ['checked_in', 'boarded', 'landed', 'on_bus', 'arrived'];
const MILESTONE_LABELS = {
  checked_in: 'Checked In',
  boarded: 'Boarded',
  landed: 'Landed',
  on_bus: 'On Bus',
  arrived: 'Arrived',
};

function MilestoneRail({ milestones, current }) {
  const currentIdx = milestones.indexOf(current);
  return (
    <div className="milestone-rail">
      {milestones.map((m, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={m} className="milestone-step">
            <div className="milestone-dot-wrap">
              {i > 0 && <div className={`milestone-line${isDone || isCurrent ? ' done' : ''}`} />}
              <div className={`milestone-dot${isDone ? ' done' : isCurrent ? ' current' : ''}`}>
                {isDone && '✓'}
              </div>
              {i < milestones.length - 1 && <div className={`milestone-line${isDone ? ' done' : ''}`} />}
            </div>
            <div className="milestone-label">{MILESTONE_LABELS[m] || m}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function TravelCard({ teamId, teamData, travelData, players, eventId = 'nsd2026' }) {
  const { isManager, teamId: myTeam } = useRole();
  const canManage = isManager && myTeam === teamId;

  const isLocal = teamData?.type === 'host' || teamData?.type === 'local';
  const milestone = travelData?.milestone;
  const attendance = travelData?.attendance || { present: 0, total: 0 };
  const presentCount = attendance.present ?? 0;
  const totalCount = attendance.total ?? players.length;
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const travelRef = doc(db, `events/${eventId}/travel/${teamId}`);

  async function markAllPresent() {
    const updates = {};
    for (const p of players) {
      const pRef = doc(db, `events/${eventId}/teams/${teamId}/players/${p.id}`);
      try { await updateDoc(pRef, { present: true }); } catch (e) { /* ignore */ }
    }
    await updateDoc(travelRef, {
      'attendance.present': players.length,
      'attendance.markedAllAt': serverTimestamp(),
    });
  }

  async function togglePlayer(player) {
    if (!canManage) return;
    const newVal = !player.present;
    const pRef = doc(db, `events/${eventId}/teams/${teamId}/players/${player.id}`);
    try {
      await updateDoc(pRef, { present: newVal });
      const newPresent = players.filter((p) => (p.id === player.id ? newVal : p.present)).length;
      await updateDoc(travelRef, { 'attendance.present': newPresent });
    } catch (e) { console.error(e); }
  }

  async function advanceMilestone() {
    const idx = TRAVEL_MILESTONES.indexOf(milestone);
    const next = TRAVEL_MILESTONES[idx + 1];
    if (!next) return;
    await updateDoc(travelRef, { milestone: next });
  }

  const statusColor = {
    local: 'var(--lime)',
    in_transit: 'var(--orange)',
    arrived: 'var(--lime)',
  }[travelData?.status] || 'var(--grey)';

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: teamData?.colorHex || '#AEAEAF', display: 'inline-block' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>{teamData?.name || teamId}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
            {isLocal ? 'Local team' : (teamData?.travel?.fromAirport || 'Travelling')}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {travelData?.status?.replace('_', ' ') || 'Unknown'}
        </span>
      </div>

      {!isLocal && milestone && (
        <MilestoneRail milestones={TRAVEL_MILESTONES} current={milestone} />
      )}

      {isLocal && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
          <span className="badge badge-lime">Squad Present</span>
        </div>
      )}

      <div className="attendance-summary" style={{ marginBottom: 12 }}>
        <span className="attendance-count">{presentCount}/{totalCount}</span>
        <div className="attendance-bar">
          <div className="attendance-fill" style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{pct}%</span>
      </div>

      {canManage && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-lime" style={{ flex: 1, fontSize: 13 }} onClick={markAllPresent}>
            Mark All Present
          </button>
          {!isLocal && TRAVEL_MILESTONES.indexOf(milestone) < TRAVEL_MILESTONES.length - 1 && (
            <button className="btn btn-orange" style={{ flex: 1, fontSize: 13 }} onClick={advanceMilestone}>
              Advance Status
            </button>
          )}
        </div>
      )}

      {players.length > 0 && (
        <div className="presence-list">
          {players.map((p) => (
            <div key={p.id} className="presence-row">
              <span className="presence-name">{p.firstName} {p.surname}</span>
              {canManage ? (
                <button
                  className={`toggle${p.present ? ' on' : ''}`}
                  onClick={() => togglePlayer(p)}
                  aria-label={p.present ? 'Mark absent' : 'Mark present'}
                />
              ) : (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.present ? 'var(--lime)' : 'var(--grey)',
                }}>
                  {p.present ? '✓' : '–'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
