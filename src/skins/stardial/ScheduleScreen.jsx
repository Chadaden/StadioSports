// Stardial SCHEDULE — the day down one rail. Node colour = kind of moment
// (match / break / ceremony); the current slot burns red with a NOW tag.
// Match rows are joined to live fixture data by slotTime (§8) so a published
// result strikes the row off here too, not just on the Fixtures tab — the
// static Program-sheet rows never carried that state on their own before.
// Icon-free — the rail and its coloured nodes do the wayfinding; slot
// content is left-aligned text.

import { useData } from '../../store/DataProvider'
import { fixtureOverallStatus } from '../../lib/matchState'
import { schedule } from '../../data/seed'
import { StatusTag } from './bits'

export default function SdScheduleScreen() {
  const { fixtures = [] } = useData()
  const nowIdx = currentSlotIndex(schedule)
  const fixtureByTime = new Map(fixtures.map((fx) => [fx.slotTime, fx]))

  return (
    <div className="sd-rail sd-rail-day">
      {schedule.map((row, i) => {
        const fixture = row.kind === 'match' ? fixtureByTime.get(row.time) : null
        const status = row.kind === 'match' ? fixtureOverallStatus(fixture) : null
        return (
          <div key={`${row.time}-${i}`}
            className={`sd-stop kind-${row.kind}${status ? ` is-${status}` : ''}${i === nowIdx ? ' is-now' : ''}`}>
            <div className="sd-stop-node">
              <span className="sd-stop-dot" />
              <span className="sd-stop-time">{row.time}</span>
            </div>
            <div className="sd-slot">
              <span className="sd-slot-body">
                <b>{row.activity}</b>
                <span>{row.venue}</span>
              </span>
              {status && <StatusTag status={status} />}
              {i === nowIdx && <span className="sd-now">NOW</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function currentSlotIndex(rows) {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  let idx = -1
  rows.forEach((r, i) => {
    const [h, m] = r.time.split(':').map(Number)
    if (h * 60 + m <= mins) idx = i
  })
  return idx
}
