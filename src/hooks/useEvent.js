import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useEvent(eventId = 'nsd2026') {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'events', eventId),
      (snap) => {
        if (snap.exists()) setEvent({ id: snap.id, ...snap.data() });
      },
      (err) => console.warn('useEvent error:', err)
    );
    return unsub;
  }, [eventId]);
  return event;
}
