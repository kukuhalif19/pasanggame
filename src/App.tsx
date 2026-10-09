import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Lobby from './pages/Lobby'
import GamePage from './pages/GamePage'

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:code" element={<Lobby />} />
        <Route path="/room/:code/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
