/* eslint-disable react-refresh/only-export-components */
// ============================================================================
// Skin system — a fully reversible visual theme layer.
//
// The whole point: the current UI is the SAFE SPACE. `classic` renders the app
// exactly as it has always rendered — none of the existing component or CSS
// code is touched. The new look (`stardial`) ships as one extra stylesheet
// whose every rule is scoped under `:root[data-skin="stardial"]`, so it is
// completely inert until this context flips the attribute on. Flip it off and
// you are back to classic with nothing to undo.
//
// Initial skin resolves: ?skin= URL param → saved choice → classic default.
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react'

const SkinContext = createContext({ skin: 'classic', setSkin: () => {}, toggle: () => {} })
const STORAGE_KEY = 'stardial-skin'
const SKINS = ['classic', 'stardial']

function initialSkin() {
  try {
    const param = new URLSearchParams(window.location.search).get('skin')
    if (param && SKINS.includes(param)) return param
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SKINS.includes(saved)) return saved
  } catch { /* storage/URL unavailable — fall through to default */ }
  return 'classic'
}

// Set the attribute synchronously at module load so a saved `stardial` choice
// paints correctly on the very first frame (no classic→stardial flash).
const FIRST = initialSkin()
if (typeof document !== 'undefined') document.documentElement.dataset.skin = FIRST

export function SkinProvider({ children }) {
  const [skin, setSkin] = useState(FIRST)

  useEffect(() => {
    document.documentElement.dataset.skin = skin
    try { localStorage.setItem(STORAGE_KEY, skin) } catch { /* ignore */ }
  }, [skin])

  const toggle = () => setSkin((s) => (s === 'stardial' ? 'classic' : 'stardial'))

  return (
    <SkinContext.Provider value={{ skin, setSkin, toggle }}>
      {children}
    </SkinContext.Provider>
  )
}

export function useSkin() {
  return useContext(SkinContext)
}
