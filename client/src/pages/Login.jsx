import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      await login({ token: data.token })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="container auth">
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <p className="muted" style={{ marginTop: 0 }}>Login to continue shopping</p>
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="alert">{error}</div>}
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          <button className="btn primary" type="submit">Login</button>
          <p className="muted">Don't have an account? <Link to="/register">Register</Link></p>
        </form>
      </div>
    </div>
  )
}
