/* eslint-disable react-refresh/only-export-components */
// Stardial icon set — hand-drawn 24×24 strokes, one weight (1.75), always
// currentColor. Replaces every emoji glyph in the Stardial skin so the app
// reads as one drawn system instead of platform emoji.

const P = {
  // broadcast waves around a dot — the Live tab
  live: (
    <>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
      <path d="M5.5 5.5a9.2 9.2 0 0 0 0 13M18.5 5.5a9.2 9.2 0 0 1 0 13" opacity=".45" />
    </>
  ),
  fixtures: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M8 3.2v4M16 3.2v4" />
    </>
  ),
  table: (
    <>
      <rect x="4" y="13" width="4.2" height="7" rx="1.2" />
      <rect x="15.8" y="10" width="4.2" height="10" rx="1.2" />
      <rect x="9.9" y="4" width="4.2" height="16" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  schedule: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.6V12l3.1 1.9" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.8 19.5c.6-3 2.7-4.7 5.2-4.7s4.6 1.7 5.2 4.7" />
      <circle cx="16.6" cy="10" r="2.5" />
      <path d="M15.4 15.2c2.4.1 4.2 1.6 4.8 4.3" />
    </>
  ),
  travel: (
    <>
      <rect x="4.5" y="4" width="15" height="13" rx="3" />
      <path d="M4.5 10.5h15M8 20v-3M16 20v-3" />
      <circle cx="8.4" cy="14" r=".6" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="14" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  soccer: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8.2 15.2 10.4 14 14.2H10L8.8 10.4Z" fill="currentColor" stroke="none" />
      <path d="M12 8.2V5M15.2 10.4l2.7-1.1M14 14.2l1.7 2.4M10 14.2l-1.7 2.4M8.8 10.4 6.1 9.3" strokeWidth="1.3" />
    </>
  ),
  netball: (
    <>
      <ellipse cx="12" cy="6.6" rx="5.6" ry="2.6" />
      <path d="M7.6 8.4c.5 2 1.6 3.2 4.4 3.2s3.9-1.2 4.4-3.2" strokeWidth="1.3" />
      <path d="M12 11.6v8M8.6 19.6h6.8" />
    </>
  ),
  whistle: (
    <>
      <path d="M4 10.5A5.5 5.5 0 1 0 14.8 12l5.7-2.6a1 1 0 0 0 0-1.8L14.3 5H6a2 2 0 0 0-2 2Z" />
      <circle cx="9.5" cy="12.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l8.5 4V4.5L8 8.5H5.5A1.5 1.5 0 0 0 4 10Z" />
      <path d="M19.5 10.2a2.6 2.6 0 0 1 0 3.6M9.5 16l1 4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.2" />
      <path d="M12 9.6V13l2.4 1.6M9.8 3.4h4.4M17.4 6.4l1.4-1.4" />
    </>
  ),
  card: (
    <rect x="7" y="4" width="10" height="16" rx="2" fill="currentColor" stroke="none" />
  ),
  trophy: (
    <>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6H5.2a2.8 2.8 0 0 0 2.9 3.4M16 6h2.8a2.8 2.8 0 0 1-2.9 3.4M12 13.5v3M8.8 19.8h6.4M10 16.5h4l.8 3.3H9.2Z" />
    </>
  ),
  play: <path d="M8.5 5.8v12.4c0 .8.9 1.3 1.6.9l9.5-6.2a1 1 0 0 0 0-1.8L10.1 4.9a1 1 0 0 0-1.6.9Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" strokeWidth="2.2" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" strokeWidth="2" />,
  undo: <path d="M7.5 5.5 4 9l3.5 3.5M4 9h9.2a5.4 5.4 0 1 1-1 10.7" />,
  chev: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.2" />
    </>
  ),
}

export default function Icon({ name, size = 20, className, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {P[name] || null}
    </svg>
  )
}

export const SPORT_ICON = { soccer: 'soccer', netball: 'netball' }
