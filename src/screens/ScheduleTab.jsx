const SCHEDULE = [
  { time: '11:45', event: 'Match 1', location: 'Both Courts' },
  { time: '12:10', event: 'Match 2', location: 'Both Courts' },
  { time: '12:35', event: 'Match 3', location: 'Both Courts' },
  { time: '13:00', event: 'Lunch Break', location: 'Catering Area' },
  { time: '14:00', event: 'Match 4', location: 'Both Courts' },
  { time: '14:25', event: 'Match 5', location: 'Both Courts' },
  { time: '14:50', event: 'Match 6', location: 'Both Courts' },
  { time: '15:15', event: 'Playoff 3rd/4th', location: 'Both Courts' },
  { time: '15:40', event: 'Finals', location: 'Both Courts' },
  { time: '16:10', event: 'Prize Giving & Closing', location: 'Main Court' },
];

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getCurrentSlotIndex() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let current = -1;
  for (let i = 0; i < SCHEDULE.length; i++) {
    const slotMin = parseTime(SCHEDULE[i].time);
    const nextMin = i + 1 < SCHEDULE.length ? parseTime(SCHEDULE[i + 1].time) : slotMin + 60;
    if (nowMin >= slotMin && nowMin < nextMin) {
      current = i;
      break;
    }
  }
  if (current === -1) {
    // Before or after all slots
    const firstMin = parseTime(SCHEDULE[0].time);
    if (nowMin < firstMin) return -1; // before event
    return SCHEDULE.length; // after event
  }
  return current;
}

export default function ScheduleTab() {
  const currentIdx = getCurrentSlotIndex();

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Day Schedule</span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>1 Aug 2026</span>
      </div>
      <div className="timeline">
        {SCHEDULE.map((item, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={i} className="timeline-item">
              <div className="timeline-time-col">
                <div className="timeline-time">{item.time}</div>
              </div>
              <div className="timeline-dot-col">
                <div className={`timeline-dot${isCurrent ? ' current' : isDone ? ' done' : ''}`} />
              </div>
              <div className="timeline-content">
                <div className={`timeline-event-name${isCurrent ? ' current' : ''}`}>
                  {item.event}
                  {isCurrent && (
                    <span className="badge badge-live" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Now</span>
                  )}
                </div>
                <div className="timeline-location">{item.location}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
