import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useTeams(eventId = 'nsd2026') {
  const [teams, setTeams] = useState({});
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `events/${eventId}/teams`),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
        setTeams(map);
      },
      (err) => console.warn('useTeams error:', err)
    );
    return unsub;
  }, [eventId]);
  return teams;
}
