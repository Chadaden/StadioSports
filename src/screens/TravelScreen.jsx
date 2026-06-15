import { useData } from '../store/DataProvider'
import { Crest } from '../components/ui'
import { MILESTONES, MILESTONE_LABELS } from '../data/seed'

// TRAVEL tab (§6): control tower. Travelling teams show a milestone rail;
// local teams collapse to "Squad present". Viewer sees read-only status.
export default function TravelScreen() {
  const { travel = {}, teams = [] } = useData()

  // Travelling teams first, then locals.
  const ordered = [...teams].sort((a, b) => {
    const at = a.type === 'travel' ? 0 : 1
    const bt = b.type === 'travel' ? 0 : 1
    return at - bt
  })

  return (
    <>
      {ordered.map((team) => (
        <TravelCard key={team.id} team={team} state={travel[team.id]} />
      ))}
    </>
  )
}

const STATUS_CHIP = {
  arrived: { label: 'Arrived', style: { color: 'var(--lime)', borderColor: '#cfe6a8' } },
  in_transit: { label: 'In transit', style: { color: 'var(--orange)', borderColor: '#f7dcae' } },
  checked_in: { label: 'Checked in', style: { color: 'var(--sky)' } },
  local: { label: 'Local', style: {} },
}

function TravelCard({ team, state }) {
  const isTravel = team.type === 'travel'
  const milestone = state?.milestone
  const arrived = milestone === 'arrived'
  const chipKey = arrived ? 'arrived' : (state?.status || 'local')
  const chip = STATUS_CHIP[chipKey] || STATUS_CHIP.local
  const att = state?.attendance || { present: 0, total: 0 }

  return (
    <div className="card travel-card">
      <div className="tc-head">
        <Crest team={team} />
        <span className="name">{team.name}</span>
        <span className="chip" style={chip.style}>{chip.label}</span>
      </div>

      {isTravel ? (
        <>
          <div className="rail">
            {MILESTONES.map((m, i) => {
              const reachedIdx = MILESTONES.indexOf(milestone)
              const cls = i < reachedIdx ? 'done' : i === reachedIdx ? 'current' : ''
              return (
                <div className={`step ${cls}`} key={m}>
                  <span className="dot" />
                  <span className="lab">{MILESTONE_LABELS[m]}</span>
                </div>
              )
            })}
          </div>
          {team.travel && (
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              {team.travel.fromAirport} → {team.travel.viaAirport} · {state?.travellers ?? '—'} travelling
            </div>
          )}
        </>
      ) : (
        <div className="local-present">
          🏠 {team.type === 'host' ? 'Host campus' : 'Local campus'} · squad on site
        </div>
      )}

      <div className="attendance">
        <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Attendance register</span>
        <span className="att-num">{att.present} / {att.total} present</span>
      </div>
    </div>
  )
}
