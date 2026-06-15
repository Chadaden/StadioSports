import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useFixtures(eventId = 'nsd2026') {
  const [fixtures, setFixtures] = useState([]);
  useEffect(() => {
    const q = query(
      collection(db, `events/${eventId}/fixtures`),
      orderBy('matchNo')
    );
    const unsub = onSnapshot(
      q,
      (snap) => setFixtures(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.warn('useFixtures error:', err)
    );
    return unsub;
  }, [eventId]);
  return fixtures;
}
