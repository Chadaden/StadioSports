import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useTravel(eventId = 'nsd2026') {
  const [travel, setTravel] = useState({});
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `events/${eventId}/travel`),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
        setTravel(map);
      },
      (err) => console.warn('useTravel error:', err)
    );
    return unsub;
  }, [eventId]);
  return travel;
}
