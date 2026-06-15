import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const RoleContext = createContext(null);

const DEV_PINS = {
  scorekeeper: '1234',
  centurion: '0000',
  musgrave: '0000',
  durbanville: '0000',
  waterfall: '0000',
};

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    role: params.get('role') || 'viewer',
    team: params.get('team') || null,
  };
}

export function RoleProvider({ children }) {
  const { role: urlRole, team: urlTeam } = parseParams();
  const [role, setRole] = useState('viewer');
  const [teamId, setTeamId] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    if (urlRole === 'viewer') {
      setRole('viewer');
      return;
    }
    // Check session storage
    const stored = sessionStorage.getItem('stadio_role');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === urlRole && (urlRole === 'scorekeeper' || parsed.team === urlTeam)) {
          setRole(parsed.role);
          setTeamId(parsed.team);
          return;
        }
      } catch (e) { /* ignore */ }
    }
    setShowPin(true);
    setAuthPending(true);
  }, [urlRole, urlTeam]);

  async function validatePin(pin) {
    // Try Firestore first
    try {
      const eventDoc = await getDoc(doc(db, 'events', 'nsd2026'));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const pins = data.pins || {};
        const key = urlRole === 'scorekeeper' ? 'scorekeeper' : (urlTeam || '');
        const correctPin = pins[key];
        if (correctPin !== undefined) {
          return pin === correctPin;
        }
      }
    } catch (e) {
      console.warn('Firestore PIN lookup failed, using dev PIN:', e);
    }
    // Fallback dev PIN
    const key = urlRole === 'scorekeeper' ? 'scorekeeper' : (urlTeam || '');
    return pin === (DEV_PINS[key] || '0000');
  }

  async function submitPin(pin) {
    const valid = await validatePin(pin);
    if (valid) {
      const newRole = urlRole;
      const newTeam = urlTeam;
      sessionStorage.setItem('stadio_role', JSON.stringify({ role: newRole, team: newTeam }));
      setRole(newRole);
      setTeamId(newTeam);
      setShowPin(false);
      setAuthPending(false);
      return true;
    }
    return false;
  }

  const value = {
    role,
    teamId,
    isViewer: role === 'viewer',
    isScorekeeper: role === 'scorekeeper',
    isManager: role === 'manager',
    showPin,
    submitPin,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
