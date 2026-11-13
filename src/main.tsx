import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Importé tôt pour ne pas rater l'événement d'installation d'Android/Chrome.
import './core/pwa/install'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
