import { useState } from 'react';
import { RoleProvider } from './contexts/RoleContext.jsx';
import SpectrumBar from './components/SpectrumBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import PinGate from './components/PinGate.jsx';
import LiveTab from './screens/LiveTab.jsx';
import FixturesTab from './screens/FixturesTab.jsx';
import TableTab from './screens/TableTab.jsx';
import TravelTab from './screens/TravelTab.jsx';
import ScheduleTab from './screens/ScheduleTab.jsx';
import SquadsTab from './screens/SquadsTab.jsx';

function AppShell() {
  const [tab, setTab] = useState('live');
  const [showSquads, setShowSquads] = useState(false);

  function renderContent() {
    if (showSquads) {
      return <SquadsTab onBack={() => setShowSquads(false)} />;
    }
    switch (tab) {
      case 'live':
        return <LiveTab onShowSquads={() => setShowSquads(true)} />;
      case 'fixtures':
        return <FixturesTab />;
      case 'table':
        return <TableTab />;
      case 'travel':
        return <TravelTab />;
      case 'schedule':
        return <ScheduleTab />;
      default:
        return <LiveTab onShowSquads={() => setShowSquads(true)} />;
    }
  }

  function handleTabChange(newTab) {
    setShowSquads(false);
    setTab(newTab);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <SpectrumBar />
        <div className="app-header-inner">
          <div className="app-title">
            <span>STADIO</span> Sports Day
          </div>
          <div className="app-date">1 Aug 2026 · Centurion</div>
        </div>
      </header>

      <main className="tab-content">
        {renderContent()}
      </main>

      <BottomNav active={showSquads ? tab : tab} onChange={handleTabChange} />
      <PinGate />
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AppShell />
    </RoleProvider>
  );
}
