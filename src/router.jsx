import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppShell from './components/layout/AppShell'

import Register      from './pages/Register'
import Home          from './pages/Home'
import Fixture       from './pages/Fixture'
import Ranking       from './pages/Ranking'
import Predict       from './pages/Predict'
import Profile       from './pages/Profile'
import Login         from './pages/Login'
import JoinGroup     from './pages/JoinGroup'
import Payment       from './pages/Payment'
import MyPredictions from './pages/MyPredictions'

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex h-screen items-center justify-center text-[var(--text-secondary)]">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={
        <PrivateRoute>
          <AppShell />
        </PrivateRoute>
      }>
        <Route index element={<Home />} />
        <Route path="fixture" element={<Fixture />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="predict/:matchId" element={<Predict />} />
        <Route path="profile" element={<Profile />} />
        <Route path="join/:inviteCode" element={<JoinGroup />} />
        <Route path="payment/:groupId" element={<Payment />} />
        <Route path="my-predictions"  element={<MyPredictions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
