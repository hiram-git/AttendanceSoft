import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './theme.jsx'
import LandingPage from './pages/Landing.jsx'
import LoginPage from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Backoffice from './pages/Backoffice.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/backoffice" element={<Backoffice />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
