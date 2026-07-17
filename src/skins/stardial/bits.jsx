// Stardial shared primitives — crest chips, status language, score digits.

import { useEffect, useRef, useState } from 'react'
import Icon, { SPORT_ICON } from './icons'

export function SdCrest({ team, size = 'md' }) {
  return (
    <span className={`sd-crest sd-crest-${size}`} style={{ '--tc': team?.colorHex || '#aeaeaf' }}>
      {team?.code || '—'}
    </span>
  )
}

export function LivePill({ compact = false }) {
  return (
    <span className={`sd-live${compact ? ' compact' : ''}`}>
      <span className="sd-live-dot" />LIVE
    </span>
  )
}

// One status vocabulary for the whole skin — shown, never explained.
export function StatusTag({ status }) {
  if (status === 'live') return <LivePill />
  if (status === 'final') return <span className="sd-tag sd-tag-final">FULL-TIME</span>
  return <span className="sd-tag">UPCOMING</span>
}

export function SportChip({ sport, size = 16 }) {
  return (
    <span className={`sd-sportchip sd-sportchip-${sport}`}>
      <Icon name={SPORT_ICON[sport]} size={size} />
    </span>
  )
}

export function SectionTitle({ icon, children, right }) {
  return (
    <div className="sd-section">
      <span className="sd-section-title">
        {icon && <Icon name={icon} size={15} />}
        {children}
      </span>
      {right && <span className="sd-section-right">{right}</span>}
    </div>
  )
}

// Score numerals that pop when the value changes (skips the mount render, so
// opening a screen is calm — only an actual goal moves).
export function ScorePop({ value, className }) {
  const [pop, setPop] = useState(false)
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setPop(true)
    const t = setTimeout(() => setPop(false), 450)
    return () => clearTimeout(t)
  }, [value])
  return <span className={`${className || ''}${pop ? ' sd-pop' : ''}`}>{value}</span>
}

// Header chip: red pulse when Firebase is live, quiet amber tag in demo mode.
export function ModeChip({ isLive }) {
  return isLive ? <LivePill compact /> : <span className="sd-tag sd-tag-demo">DEMO</span>
}
