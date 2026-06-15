import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useRole } from '../contexts/RoleContext.jsx';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

export default function AnnouncementFeed({ announcements, eventId = 'nsd2026' }) {
  const { isScorekeeper } = useRole();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function postAnnouncement() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPosting(true);
    try {
      await addDoc(collection(db, `events/${eventId}/announcements`), {
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setText('');
      setShowForm(false);
    } catch (e) {
      console.error('Post announcement error:', e);
    }
    setPosting(false);
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Announcements</span>
        {isScorekeeper && (
          <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px', minHeight: 36 }} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Post'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="announce-form">
          <textarea
            className="announce-textarea"
            placeholder="Type an announcement…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn btn-primary btn-block"
            onClick={postAnnouncement}
            disabled={posting || !text.trim()}
          >
            {posting ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {announcements.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <div className="empty-state-icon">📢</div>
            <div className="empty-state-text">No announcements yet</div>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="announcement-item">
              <div className="announcement-meta">
                <span className="announcement-time">{formatTime(a.createdAt)}</span>
              </div>
              <div className="announcement-text">{a.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
