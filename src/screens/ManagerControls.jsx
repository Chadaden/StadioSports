import { useData } from '../store/DataProvider'
import { useRole } from '../store/RoleContext'
import { MILESTONES, MILESTONE_LABELS } from '../data/seed'

// Team Manager controls (§3, §6). Renders on the Travel tab only for the
// manager's own team — one-tap attendance mark-all + per-player toggles +
// milestone advance. Viewer and Scorekeeper see zero trace of these. (§3)
export default function ManagerControls({ team, travelState }) {
  const { role, teamId } = useRole()
  if (role !== 'manager' || teamId !== team?.id) return null

  return (
    <div className="mgr-panel">
      <AttendancePanel team={team} />
      {team.type === 'travel' && <MilestonePanel teamId={team.id} travelState={travelState} />}
    </div>
  )
}

function AttendancePanel({ team }) {
  const { actions } = useData()
  const players = team.players || []
  const presentCount = players.filter((p) => p.present).length

  if (players.length === 0) {
    return (
      <div className="mgr-section">
        <div className="kicker" style={{ marginBottom: 6 }}>Attendance register</div>
        <div className="muted" style={{ fontSize: 12.5 }}>Roster pending — add players to enable the register.</div>
      </div>
    )
  }

  const allPresent = presentCount === players.length

  return (
    <div className="mgr-section">
      <div className="mgr-sec-head">
        <span className="kicker">Attendance register</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>
          {presentCount} / {players.length}
        </span>
      </div>

      {!allPresent && (
        <button
          className="mgr-btn-primary"
          onClick={() => actions.markAllPresent(team.id)}
        >
          ✓ Mark all present
        </button>
      )}

      <div className="att-list">
        {players.map((p) => (
          <button
            key={p.id}
            className={`att-row ${p.present ? 'present' : ''}`}
            onClick={() => actions.togglePresent(team.id, p.id, p.present)}
          >
            <span className="att-check">{p.present ? '✓' : ''}</span>
            <span className="att-name">{p.firstName} {p.surname}</span>
            <span className="att-tag muted">{p.sport ?? p.role}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MilestonePanel({ teamId, travelState }) {
  const { actions } = useData()
  const current = travelState?.milestone
  const currentIdx = MILESTONES.indexOf(current)
  const arrived = current === 'arrived'

  return (
    <div className="mgr-section">
      <div className="mgr-sec-head">
        <span className="kicker">Travel status</span>
      </div>
      {arrived ? (
        <div className="mgr-arrived">🎉 Squad arrived at Centurion Campus</div>
      ) : (
        <button
          className="mgr-btn-primary"
          onClick={() => actions.advanceMilestone(teamId)}
        >
          Advance → {MILESTONE_LABELS[MILESTONES[currentIdx + 1]] ?? '—'}
        </button>
      )}
      <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
        Current: {MILESTONE_LABELS[current] ?? '—'}
      </div>
    </div>
  )
}
