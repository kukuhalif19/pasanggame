import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './stores/gameStore'

// Hook tes: di dev, store dipasang di window supaya E2E bisa menyiapkan
// skenario deterministik (papan berisi huruf tertentu) tanpa klik manual.
// Blok ini hilang otomatis di build production (import.meta.env.DEV).
if (import.meta.env.DEV) {
  ;(window as any).__gameStore = useGameStore
}

// NOTE: StrictMode sengaja dimatikan karena app ini memakai side-effect
// realtime (BroadcastChannel). StrictMode me-mount effect 2x di dev yang
// memicu broadcast ganda dan PLAYER_LEFT palsu.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
