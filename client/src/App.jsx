import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Billing from './pages/Billing'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Trending from './pages/Trending'
import { useAuth } from './state/AuthContext'
import { useCart } from './state/CartContext'
import Footer from './components/Footer'
import ChatBox from './components/ChatBox'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, logout } = useAuth()
  const { items } = useCart()
  const cartItemCount = items.length

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="logo" title="MegaMart">
          MegaMart
        </Link>
        <nav className="nav">
          {user && (
            <div className="nav-logo" aria-label={`Logged in as ${user.name}`}>
              <span className="user-badge">
                {user.name?.trim()?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <Link to="/shop">Shop</Link>
          <Link to="/trending">Trending</Link>
          <Link to="/cart">
            Cart
            {/* Display the item count badge */}
            {cartItemCount > 0 && <span className="badge-cart-count">{cartItemCount > 9 ? '9+' : cartItemCount}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <button className="btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <ChatBox />
      <Footer />
    </div>
  )
}