import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useGroup } from './context/GroupContext'
import { useLocation } from './context/LocationContext'
import { useNotification } from './context/NotificationContext'
import Layout from './components/layout/Layout'
import AuthLayout from './components/layout/AuthLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Geofences from './pages/Geofences'
import SOSAlerts from './pages/SOSAlerts'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import ToastContainer from './components/common/ToastContainer'
import LoadingScreen from './components/common/LoadingScreen'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const { fetchGroups } = useGroup()
  const { subscribeToNotifications } = useNotification()

  // Fetch groups and subscribe to notifications when user logs in
  React.useEffect(() => {
    if (user) {
      fetchGroups()
      subscribeToNotifications()
    }
  }, [user, fetchGroups, subscribeToNotifications])

  if (authLoading) {
    return <LoadingScreen />
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupDetail />} />
          <Route path="/geofences/:groupId" element={<Geofences />} />
          <Route path="/sos/:groupId" element={<SOSAlerts />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App