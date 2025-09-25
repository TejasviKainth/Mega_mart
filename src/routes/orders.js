const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - create order
router.post('/', protect, async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;
  if (!orderItems || orderItems.length === 0)
    return res.status(400).json({ message: 'No order items' });

  // Calculate prices and verify stock
  let itemsPrice = 0;
  for (const item of orderItems) {
    const p = await Product.findById(item.product);
    if (!p) return res.status(400).json({ message: 'Product not found' });
    if (p.countInStock < item.qty) return res.status(400).json({ message: 'Insufficient stock' });
    itemsPrice += p.price * item.qty;
  }
  const taxPrice = Number((0.1 * itemsPrice).toFixed(2));
  const shippingPrice = itemsPrice > 1000 ? 0 : 100;
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

  const order = await Order.create({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // Decrement stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.qty } });
  }

  res.status(201).json(order);
});

// GET /api/orders/my - user orders
router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('orderItems.product', 'name price image');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (String(order.user) !== req.user.id && !req.user.isAdmin)
    return res.status(403).json({ message: 'Not authorized' });
  res.json(order);
});

module.exports = router;
