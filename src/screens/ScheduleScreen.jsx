import { schedule } from '../data/seed'

// SCHEDULE tab (§6): vertical timeline of the day. Static content. The "now"
// highlight is driven by wall-clock time vs slot times (only meaningful on
// the event day; harmless otherwise).
export default function ScheduleScreen() {
  const nowIdx = currentSlotIndex(schedule)
  return (
    <div className="timeline">
      {schedule.map((row, i) => (
        <div key={`${row.time}-${i}`} className={`tl-row ${row.kind} ${i === nowIdx ? 'now' : ''}`}>
          <div className="tl-time">{row.time}</div>
          <div className="tl-body">
            <div className="act">{row.activity}</div>
            <div className="ven">{row.venue}</div>
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
