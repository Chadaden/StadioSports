import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './skins/stardial.css'
import './pwa'
import App from './App.jsx'

// Stardial is the single production interface. Keeping one presentation layer
// prevents an old, icon-heavy skin from resurfacing through a saved browser
// preference or URL parameter.
document.documentElement.dataset.skin = 'stardial'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
