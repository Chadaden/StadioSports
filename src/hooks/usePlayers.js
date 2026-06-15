import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function usePlayers(teamId, eventId = 'nsd2026') {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    if (!teamId) { setPlayers([]); return; }
    const q = query(
      collection(db, `events/${eventId}/teams/${teamId}/players`),
      orderBy('surname')
    );
    const unsub = onSnapshot(
      q,
      (snap) => setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.warn('usePlayers error:', err)
    );
    return unsub;
  }, [teamId, eventId]);
  return players;
}
