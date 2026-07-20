import { useEffect } from 'react'
import { Crest } from './ui'

// Manager-only player card (§9). Opened by tapping a player's name in the
// attendance register or Squads view — shows the private profile (medical,
// emergency contact with tap-to-call, dietary, notes) for the manager's own
// team. The profile data only ever reaches the client for the manager role
// (see DataProvider), so this renders nothing sensitive for anyone else.

function telHref(display) {
  const first = display.split('/')[0]
  const digits = first.replace(/\D/g, '')
  // SA numbers: 0XX XXX XXXX → +27 for reliable dialing from any device.
  if (digits.length === 10 && digits.startsWith('0')) return `tel:+27${digits.slice(1)}`
  return `tel:${digits}`
}

function CallRow({ label, name, number }) {
  if (!number) return null
  return (
    <div className="pc-row">
      <div className="pc-row-main">
        <span className="pc-label">{label}</span>
        <span className="pc-value">{name ? <>{name}<br /></> : null}<span className="pc-num">{number}</span></span>
      </div>
      <a className="pc-call" href={telHref(number)}>Call</a>
    </div>
  )
}

function InfoRow({ label, value, alert }) {
  return (
    <div className={`pc-row${alert ? ' pc-alert' : ''}`}>
      <div className="pc-row-main">
        <span className="pc-label">{label}</span>
        <span className="pc-value">{value || 'None recorded'}</span>
      </div>
    </div>
  )
}

export default function PlayerCard({ player, team, profile, onClose }) {
  // Esc closes; lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!player) return null

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="pc-head">
          <Crest team={team} />
          <div className="pc-title">
            <div className="pc-name">{player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.firstName} {player.surname}</div>
            <div className="pc-tags">
              {player.sport && <span className="tag-role">{player.sport}</span>}
              {player.isGK && <span className="tag-role tag-gk">GK</span>}
              {player.role === 'support' && <span className="tag-role">Support</span>}
              {player.role === 'hoc' && <span className="tag-role">HOC</span>}
              <span className={`tag-role ${player.present ? 'tag-present' : ''}`}>
                {player.present ? 'Present' : 'Not marked present'}
              </span>
            </div>
          </div>
          <button className="pc-close" onClick={onClose}>Close</button>
        </div>

        {profile ? (
          <div className="pc-body">
            <InfoRow label="Medical conditions" value={profile.medical} alert={Boolean(profile.medical)} />
            {profile.emergencyPhone || profile.emergencyName ? (
              <CallRow label="Emergency contact" name={profile.emergencyName} number={profile.emergencyPhone} />
            ) : (
              <InfoRow label="Emergency contact" value={null} />
            )}
            <CallRow label="Player cell" number={profile.phone} />
            <InfoRow label="Dietary requirements" value={profile.dietary} />
            {profile.notes && <InfoRow label="Notes" value={profile.notes} />}
          </div>
        ) : (
          <div className="pc-body">
            <div className="muted" style={{ fontSize: 13, padding: '4px 0' }}>
              No private details on file for this player yet.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
