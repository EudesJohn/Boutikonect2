import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Loading from './components/ui/Loading'

// Pages principales
import Home from './pages/Home'
import Products from './pages/Products'
import Services from './pages/Services'
import ProductDetail from './pages/ProductDetail'
import ServiceDetail from './pages/ServiceDetail'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'

// Pages utilisateur
import Profile from './pages/Profile'
import UserDashboard from './pages/UserDashboard'
import Favorites from './pages/Favorites'
import Messages from './pages/Messages'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Checkout from './pages/Checkout'
import ForgotPassword from './pages/ForgotPassword'

// Pages vendeur
import SellerDashboard from './pages/SellerDashboard'
import SellerProducts from './pages/SellerProducts'
import SellerOrders from './pages/SellerOrders'
import SellerAnalytics from './pages/SellerAnalytics'
import Publish from './pages/Publish'
import MyProducts from './pages/MyProducts'
import Promote from './pages/Promote'
import ReceiptPage from './pages/ReceiptPage'

// Pages admin
import Admin from './pages/Admin'

// Page vendeur public
import SellerProfile from './pages/SellerProfile'

// Pages info
import About from './pages/About'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children, requireSeller = false, requireAdmin = false }) {
  const { loading, user, profile } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading message="Chargement..." variant="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireSeller && profile && !profile.is_seller) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && profile && !profile.is_admin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* ======================== Pages publiques ======================== */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/services" element={<Services />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/service/:id" element={<ServiceDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/search" element={<Search />} />
        <Route path="/seller/:id" element={<SellerProfile />} />

        {/* ======================== Authentification ======================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ======================== Pages utilisateur (protégées) ======================== */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        {/* ======================== Pages vendeur (protégées) ======================== */}
        <Route path="/seller/dashboard" element={<ProtectedRoute requireSeller><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/products" element={<ProtectedRoute requireSeller><SellerProducts /></ProtectedRoute>} />
        <Route path="/seller/orders" element={<ProtectedRoute requireSeller><SellerOrders /></ProtectedRoute>} />
        <Route path="/seller/analytics" element={<ProtectedRoute requireSeller><SellerAnalytics /></ProtectedRoute>} />
        <Route path="/publish" element={<ProtectedRoute requireSeller><Publish /></ProtectedRoute>} />
        <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
        <Route path="/promote/:id" element={<ProtectedRoute requireSeller><Promote /></ProtectedRoute>} />
        <Route path="/quittance" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />

        {/* ======================== Pages admin ======================== */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />

        {/* ======================== Pages info ======================== */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* ======================== 404 ======================== */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
