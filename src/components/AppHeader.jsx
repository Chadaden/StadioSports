import { SpectrumBar } from './ui'
import { useData } from '../store/DataProvider'

// Sticky compact header (§5.3). Shows event name + live/demo data mode.
export default function AppHeader() {
  const { event, isLive } = useData()
  return (
    <header className="appheader">
      <SpectrumBar />
      <div className="bar">
        <div className="title">
          <span className="kicker">STADIO · National Sports Day</span>
          <b>{event?.name || 'Live Event Hub'}</b>
        </div>
        <span className={`mode ${isLive ? 'live' : 'demo'}`}>
          {isLive ? '● LIVE' : 'DEMO DATA'}
        </span>
      </div>
    </header>
  )
}
