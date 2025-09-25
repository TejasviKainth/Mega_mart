import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../state/CartContext'

export default function Billing() {
  const { items, summary, clearCart } = useCart()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }
    setLoading(true)
    try {
      const orderItems = items.map(i => ({
        product: i.product,
        name: i.name,
        qty: i.qty,
        price: i.price,
        image: i.image,
      }))
      await api.post('/orders', {
        orderItems,
        shippingAddress: address,
        paymentMethod
      })
      clearCart()
      navigate('/orders')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="muted">Home / Checkout</div>
        <h2 style={{ margin: 0 }}>Billing & Shipping</h2>
      </div>
      <div className="checkout-grid">
        <form onSubmit={placeOrder} className="form card" style={{ padding: 16 }}>
          {error && <div className="alert">{error}</div>}
          <h3>Shipping Address</h3>
          <label>Address Line 1</label>
          <input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} required placeholder="House / Flat / Street" />
          <label>Address Line 2</label>
          <input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Landmark (optional)" />
          <div className="row">
            <div className="col">
              <label>City</label>
              <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required />
            </div>
            <div className="col">
              <label>State</label>
              <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} required />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>Postal Code</label>
              <input value={address.postalCode} onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))} required />
            </div>
            <div className="col">
              <label>Country</label>
              <input value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} required />
            </div>
          </div>

          <h3>Payment</h3>
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="COD">Cash on Delivery</option>
            <option value="Card" disabled>Card (demo)</option>
            <option value="UPI" disabled>UPI (demo)</option>
          </select>

          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Placing order...' : 'Place Order'}</button>
        </form>

        <div className="card summary" style={{ height: 'fit-content', padding: 16 }}>
          <h3>Order Summary</h3>
          <ul>
            {items.map(i => (
              <li key={i.product} className="row between">
                <span>{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <hr />
          <p>Items: ₹{summary.itemsPrice.toFixed(2)}</p>
          <p>Tax (10%): ₹{summary.taxPrice.toFixed(2)}</p>
          <p>Shipping: ₹{summary.shippingPrice.toFixed(2)}</p>
          <p className="price large">Total: ₹{summary.totalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
