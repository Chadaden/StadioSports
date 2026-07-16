import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './skins/stardial.css'
import './pwa'
import App from './App.jsx'
import { SkinProvider } from './skins/SkinContext'
import SkinSwitcher from './skins/SkinSwitcher'

// The skin layer wraps the app without altering it: SkinProvider defaults to
// the classic look (existing UI untouched), and the stardial stylesheet stays
// inert until the switcher flips data-skin. Nothing here changes classic render.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SkinProvider>
      <App />
      <SkinSwitcher />
    </SkinProvider>
  </StrictMode>,
)
