import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const DELIVERY_WINDOW_MS = 15 * 1000
const ORDER_FILTERS = ['all', 'processing', 'delivered']

function formatCurrency(value = 0) {
  const amount = Number(value) || 0
  return `₹${amount.toFixed(2)}`
}

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms)
  const minutes = String(Math.floor(safeMs / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((safeMs % 60000) / 1000)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const autoDeliveredRef = useRef(new Set())

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const { data } = await api.get('/orders/my')
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      if (showLoader) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  const ordersWithCountdown = useMemo(() => {
    return orders.map(order => {
      const createdAtMs = new Date(order.createdAt).getTime()
      const elapsed = now - createdAtMs
      const remaining = DELIVERY_WINDOW_MS - elapsed
      const countdownActive = !order.isDelivered && remaining > 0
      const displayMs = Math.max(0, remaining)
      return {
        ...order,
        countdownActive,
        countdownLabel: formatCountdown(displayMs)
      }
    })
  }, [orders, now])

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    const processing = orders.filter(order => !order.isDelivered).length
    const delivered = orders.length - processing
    return { totalSpent, processing, delivered }
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (filter === 'processing') return ordersWithCountdown.filter(order => !order.isDelivered)
    if (filter === 'delivered') return ordersWithCountdown.filter(order => order.isDelivered)
    return ordersWithCountdown
  }, [ordersWithCountdown, filter])

  const emptyCopy = useMemo(() => {
    if (filter === 'processing') return 'No orders are currently being prepared.'
    if (filter === 'delivered') return 'No delivered orders yet. Complete an order to see it here.'
    return 'You have no orders yet. Start shopping to place your first order!'
  }, [filter])

  useEffect(() => {
    const justCompleted = ordersWithCountdown.find(order => !order.isDelivered && !order.countdownActive && order.countdownLabel === '00:00')
    if (justCompleted && !autoDeliveredRef.current.has(justCompleted._id)) {
      autoDeliveredRef.current.add(justCompleted._id)
      const deliveredStamp = new Date().toISOString()
      setOrders(prev => prev.map(o => (o._id === justCompleted._id ? { ...o, isDelivered: true, deliveredAt: deliveredStamp } : o)))
      navigate(`/orders/${justCompleted._id}/delivered`, {
        state: {
          order: {
            ...justCompleted,
            isDelivered: true,
            deliveredAt: deliveredStamp
          }
        }
      })
    }
  }, [ordersWithCountdown, navigate])

  if (loading) return <div className="container"><p>Loading...</p></div>

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="muted">Home / Orders</div>
        <h2 style={{ margin: 0 }}>My Orders</h2>
      </div>
      <div className="order-toolbar">
        <div className="order-filter-group">
          {ORDER_FILTERS.map(option => (
            <button
              key={option}
              type="button"
              className={`chip ${filter === option ? 'chip--active' : ''}`}
              onClick={() => setFilter(option)}
            >
              {option === 'all' && 'All'}
              {option === 'processing' && 'Processing'}
              {option === 'delivered' && 'Delivered'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fetchOrders(false)}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh list'}
        </button>
      </div>

      <div className="order-meta-bar">
        <div className="meta-card">
          <span className="muted">Total spent</span>
          <strong>{formatCurrency(stats.totalSpent)}</strong>
        </div>
        <div className="meta-card">
          <span className="muted">Processing</span>
          <strong>{stats.processing}</strong>
        </div>
        <div className="meta-card">
          <span className="muted">Delivered</span>
          <strong>{stats.delivered}</strong>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          <p>{emptyCopy}</p>
        </div>
      ) : (
        <div className="orders-track-wrapper">
          <div className="orders-track">
            {filteredOrders.map(o => (
              <article key={o._id} className="card order-card">
                <div className="row between order-head">
                  <div>
                    <h4 style={{ marginBottom: 4 }}>Order #{o._id.slice(-6).toUpperCase()}</h4>
                    <p className="muted" style={{ margin: 0 }}>Placed on {new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="order-status">
                    <span className={`badge ${o.isDelivered ? 'success' : 'warning'}`}>{o.isDelivered ? 'Delivered' : 'Processing'}</span>
                    {!o.isDelivered && (
                      <span className={`countdown-pill ${o.countdownActive ? '' : 'countdown-pill--done'}`}>
                        <span className="countdown-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" role="img" focusable="false">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" />
                            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </span>
                        <div className="countdown-copy">
                          <span className="countdown-text">Delivery in {o.countdownLabel}</span>
                          <small className="countdown-subtext">10-min express window</small>
                        </div>
                      </span>
                    )}
                  </div>
                </div>
                <div className="order-items-scroll">
                  {o.orderItems.map((it, idx) => (
                    <div key={idx} className="order-item-row">
                      <div>
                        <p className="order-item-name">{it.name}</p>
                        <span className="muted">Qty: {it.qty}</span>
                      </div>
                      <strong>{formatCurrency(it.price * it.qty)}</strong>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="row between order-card-footer">
                  <div>
                    <span className="muted">Total</span>
                    <strong style={{ display: 'block' }}>₹{o.totalPrice.toFixed(2)}</strong>
                  </div>
                  <Link
                    to={`/orders/${o._id}`}
                    state={{ order: o }}
                    className="btn btn-link"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
