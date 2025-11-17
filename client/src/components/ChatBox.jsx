import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

export default function ChatBox() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Hi! How can I help you today?' }
  ])
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const replyFor = (text) => {
    const t = text.toLowerCase()
    if (/order|status|track/.test(t)) return 'You can view your order status on the Orders page. Need help with a specific order ID?'
    if (/refund|return/.test(t)) return 'Refunds are processed within 5-7 business days after approval.'
    if (/help|support|hi|hello/.test(t)) return 'Hello! I\'m here to help. Ask about orders, returns, or browsing products.'
    if (/shop|browse|product|price/.test(t)) return 'Browse products on the Shop page. Use filters to narrow down choices.'
    return "Got it. I'll pass this to the team. Anything else I can help with?"
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || typing) return
    const userMsg = { id: Date.now(), from: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)
    
    // Order ID detection: accept full 24-hex or the short code shown in Orders page
    const fullIdMatch = text.match(/\b([a-f0-9]{24})\b/i)
    const shortIdMatch = text.match(/#?([a-z0-9]{6})\b/i)

    const respond = (botTextOrNode) => {
      const botMsg = { id: Date.now() + 1, from: 'bot', text: botTextOrNode }
      setMessages((prev) => [...prev, botMsg])
      setTyping(false)
    }

    const formatOrderSummary = (order) => {
      try {
        const items = order.orderItems || []
        const list = items.map(it => `${it.name} × ${it.qty} — ₹${(it.price * it.qty).toFixed(2)}`).join('\n')
        const total = typeof order.totalPrice === 'number' ? `\nTotal: ₹${order.totalPrice.toFixed(2)}` : ''
        const code = order._id ? `#${String(order._id).slice(-6).toUpperCase()}` : ''
        return `Order ${code} items:\n${list}${total}`
      } catch {
        return 'I found your order but could not format the items.'
      }
    }

    const findByShortSuffix = async (suffix6) => {
      const { data } = await api.get('/orders/my')
      const lower = suffix6.toLowerCase()
      const match = (data || []).find(o => String(o._id).toLowerCase().endsWith(lower))
      return match
    }

    try {
      if (fullIdMatch) {
        const id = fullIdMatch[1]
        const { data } = await api.get(`/orders/${id}`)
        respond(formatOrderSummary(data))
        return
      }
      if (/order|status|track|products?/i.test(text) && shortIdMatch) {
        const short = shortIdMatch[1]
        const order = await findByShortSuffix(short)
        if (order) {
          respond(formatOrderSummary(order))
        } else {
          respond('I could not find an order matching that code in your account.')
        }
        return
      }
      // Fallback small-intent reply
      setTimeout(() => {
        respond(replyFor(text))
      }, 500)
    } catch (err) {
      console.error('Order lookup failed', err)
      respond('Sorry, I could not fetch that order. Please check the ID and try again.')
    }
  }

  return (
    <div className={`chatbox ${open ? 'open' : ''}`}>
      <button className="chatbox-toggle btn primary" onClick={() => setOpen(v => !v)} aria-label="Toggle chat">
        {open ? 'Close Chat' : 'Chat'}
      </button>

      <div className="chatbox-panel">
        <div className="chatbox-header">
          <div className="row" style={{ gap: 8 }}>
            <span className="status-dot" aria-hidden />
            <div>
              <strong>Support</strong>
              <div className="muted" style={{ fontSize: 12 }}>Typically replies in under a minute</div>
            </div>
          </div>
        </div>
        <div className="chatbox-body">
          {messages.map(m => (
            <div key={m.id} className={`chat-msg ${m.from}`}>
              <div className="bubble">{m.text}</div>
            </div>
          ))}

          {typing && (
            <div className="chat-msg bot">
              <div className="bubble">
                <span className="typing">
                  <i className="dot" />
                  <i className="dot" />
                  <i className="dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form className="chatbox-input" onSubmit={handleSend}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button className="btn" type="submit" disabled={!input.trim() || typing}>Send</button>
        </form>
      </div>
    </div>
  )
}
