import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { LocationProvider } from './context/LocationContext'
import { NotificationProvider } from './context/NotificationContext'
import App from './App.jsx'
import SplashScreen from './components/ui/SplashScreen'
import './index.css'

function AppContent() {
  const { loading: authLoading } = useAuth();

  return (
    <SplashScreen ready={!authLoading} minDuration={2000}>
      <CartProvider>
        <LocationProvider>
          <NotificationProvider>
            <App />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '12px',
                fontFamily: "'Poppins', sans-serif",
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
              },
            }}
          />
          </NotificationProvider>
        </LocationProvider>
      </CartProvider>
    </SplashScreen>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
