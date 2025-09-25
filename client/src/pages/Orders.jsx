import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/orders/my')
      setOrders(data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="container"><p>Loading...</p></div>

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="muted">Home / Orders</div>
        <h2 style={{ margin: 0 }}>My Orders</h2>
      </div>
      {orders.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          <p>You have no orders yet.</p>
        </div>
      ) : (
        <div className="stack">
          {orders.map(o => (
            <div key={o._id} className="card" style={{ padding: 16 }}>
              <div className="row between">
                <h4>Order #{o._id.slice(-6).toUpperCase()}</h4>
                <span className={`badge ${o.isDelivered ? 'success' : 'warning'}`}>{o.isDelivered ? 'Delivered' : 'Processing'}</span>
              </div>
              <p className="muted">Placed on {new Date(o.createdAt).toLocaleString()}</p>
              <ul>
                {o.orderItems.map((it, idx) => (
                  <li key={idx} className="row between">
                    <span>{it.name} × {it.qty}</span>
                    <span>₹{(it.price * it.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr />
              <div className="row between">
                <span>Total</span>
                <strong>₹{o.totalPrice.toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
