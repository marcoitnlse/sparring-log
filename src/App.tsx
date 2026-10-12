import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/NavBar'
import { LoginPage } from './pages/LoginPage'
import { QuickLogPage } from './pages/QuickLogPage'
import { HistoryPage } from './pages/HistoryPage'
import { OpponentsPage } from './pages/OpponentsPage'
import { StatsPage } from './pages/StatsPage'

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <QuickLogPage />
          </Protected>
        }
      />
      <Route
        path="/history"
        element={
          <Protected>
            <HistoryPage />
          </Protected>
        }
      />
      <Route
        path="/opponents"
        element={
          <Protected>
            <OpponentsPage />
          </Protected>
        }
      />
      <Route
        path="/stats"
        element={
          <Protected>
            <StatsPage />
          </Protected>
        }
      />
    </Routes>
  )
}
