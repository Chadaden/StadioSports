// Stardial SCHEDULE — the day down one rail. Node colour = kind of moment
// (match / break / ceremony); the current slot burns red with a NOW tag.
// Same static schedule + wall-clock logic as classic. Icon-free — the rail
// and its coloured nodes do the wayfinding; slot content is left-aligned text.

import { schedule } from '../../data/seed'

export default function SdScheduleScreen() {
  const nowIdx = currentSlotIndex(schedule)
  return (
    <div className="sd-rail sd-rail-day">
      {schedule.map((row, i) => (
        <div key={`${row.time}-${i}`} className={`sd-stop kind-${row.kind}${i === nowIdx ? ' is-now' : ''}`}>
          <div className="sd-stop-node">
            <span className="sd-stop-time">{row.time}</span>
            <span className="sd-stop-dot" />
          </div>
          <div className="sd-slot">
            <span className="sd-slot-body">
              <b>{row.activity}</b>
              <span>{row.venue}</span>
            </span>
            {i === nowIdx && <span className="sd-now">NOW</span>}
          </div>
        </div>
      ))}
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
