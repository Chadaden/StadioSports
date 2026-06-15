import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useAnnouncements(eventId = 'nsd2026') {
  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => {
    const q = query(
      collection(db, `events/${eventId}/announcements`),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.warn('useAnnouncements error:', err)
    );
    return unsub;
  }, [eventId]);
  return announcements;
}
