import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { GroupProvider } from './context/GroupContext'
import { LocationProvider } from './context/LocationContext'
import { NotificationProvider } from './context/NotificationContext'
import { registerSW } from './utils/pwa'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          <LocationProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </LocationProvider>
        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW()
}