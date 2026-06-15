import { useState } from 'react';
import { useFixtures } from '../hooks/useFixtures.js';
import { useTeams } from '../hooks/useTeams.js';
import { useAnnouncements } from '../hooks/useAnnouncements.js';
import { useEvent } from '../hooks/useEvent.js';
import { useRole } from '../contexts/RoleContext.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import AnnouncementFeed from '../components/AnnouncementFeed.jsx';

const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'nsd2026';

function HeroCard({ fixture, teams }) {
  if (!fixture) return null;
  const homeTeam = teams[fixture.homeTeamId];
  const awayTeam = teams[fixture.awayTeamId];
  const soccer = fixture.soccer || {};
  const netball = fixture.netball || {};

  return (
    <div className="hero-card">
      <div className="hero-card-header">
        <span className="hero-match-label">
          Match {fixture.matchNo} · {fixture.slotTime}
        </span>
        <span className="badge badge-live">● Live</span>
      </div>
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {homeTeam && (
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: homeTeam.colorHex, display: 'inline-block' }} />
          )}
          <span style={{ fontSize: 14, fontWeight: 700 }}>{homeTeam?.name || fixture.homeTeamId}</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>vs</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{awayTeam?.name || fixture.awayTeamId}</span>
          {awayTeam && (
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: awayTeam.colorHex, display: 'inline-block' }} />
          )}
        </div>
      </div>
      <div className="hero-sports">
        <div className="hero-sport">
          <div className="hero-sport-label">⚽ Soccer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="hero-score">{soccer.home ?? 0}</span>
            <span className="hero-sep">–</span>
            <span className="hero-score">{soccer.away ?? 0}</span>
          </div>
          {(soccer.scorers || []).length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              {soccer.scorers.map((s, i) => (
                <span key={i} style={{ marginRight: 4 }}>⚽ {typeof s === 'string' ? s : s.name}</span>
              ))}
            </div>
          )}
        </div>
        <div className="divider" />
        <div className="hero-sport">
          <div className="hero-sport-label">🏐 Netball</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="hero-score">{netball.home ?? 0}</span>
            <span className="hero-sep">–</span>
            <span className="hero-score">{netball.away ?? 0}</span>
          </div>
          {(netball.scorers || []).length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              {netball.scorers.map((s, i) => (
                <span key={i} style={{ marginRight: 4 }}>🏐 {typeof s === 'string' ? s : s.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UpNextCard({ fixture, teams }) {
  const home = teams[fixture.homeTeamId];
  const away = teams[fixture.awayTeamId];
  return (
    <div className="up-next-card">
      <span className="up-next-time">{fixture.slotTime}</span>
      <div className="up-next-teams">
        <span style={{ color: home?.colorHex || 'var(--ink)' }}>{home?.name || fixture.homeTeamId}</span>
        <span style={{ color: 'var(--grey)', margin: '0 4px' }}>vs</span>
        <span style={{ color: away?.colorHex || 'var(--ink)' }}>{away?.name || fixture.awayTeamId}</span>
      </div>
      <span className="up-next-sport">⚽🏐</span>
    </div>
  );
}

export default function LiveTab({ onShowSquads }) {
  const fixtures = useFixtures(EVENT_ID);
  const teams = useTeams(EVENT_ID);
  const announcements = useAnnouncements(EVENT_ID);
  const event = useEvent(EVENT_ID);

  const liveFixtures = fixtures.filter((f) =>
    f.soccer?.status === 'live' || f.netball?.status === 'live'
  );
  const upcomingFixtures = fixtures.filter(
    (f) => f.soccer?.status === 'upcoming' && f.netball?.status === 'upcoming'
  ).slice(0, 3);

  const streamUrlSoccer = event?.streamUrl?.soccer || '#';
  const streamUrlNetball = event?.streamUrl?.netball || '#';

  return (
    <div>
      {liveFixtures.length > 0 ? (
        liveFixtures.map((f) => <HeroCard key={f.id} fixture={f} teams={teams} />)
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚽🏐</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No live match right now</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Check Fixtures for the schedule</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 4px' }}>
        <a
          href={streamUrlSoccer}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ flex: 1, textDecoration: 'none', fontSize: 13 }}
        >
          ▶ Watch Soccer
        </a>
        <a
          href={streamUrlNetball}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ flex: 1, textDecoration: 'none', fontSize: 13 }}
        >
          ▶ Watch Netball
        </a>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <button className="btn btn-outline btn-block" style={{ fontSize: 13 }} onClick={onShowSquads}>
          View Squads
        </button>
      </div>

      {upcomingFixtures.length > 0 && (
        <div>
          <div className="section-header">
            <span className="section-title">Up Next</span>
          </div>
          {upcomingFixtures.map((f) => (
            <UpNextCard key={f.id} fixture={f} teams={teams} />
          ))}
        </div>
      )}

      <AnnouncementFeed announcements={announcements} eventId={EVENT_ID} />
    </div>
  );
}
