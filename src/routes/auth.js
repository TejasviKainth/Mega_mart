const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendLoginEmail, sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

function generateToken(user) {
  return jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post(
  '/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  }
);

// Step 1: Login -> send OTP (no token yet)
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate 6-digit OTP and set expiry 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email (fire and forget)
    setImmediate(() => {
      sendOtpEmail(user, otp).catch(() => {});
    });

    return res.json({ message: 'OTP sent to your email. Please verify to continue.', needOtp: true });
  }
);

// Step 2: Verify OTP -> issue JWT token
router.post(
  '/verify-otp',
  [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP not found. Please login again.' });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    // Clear OTP and return token
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Optional: send successful verification email (non-blocking)
    setImmediate(() => {
      sendLoginEmail(user, { ip: req.ip, ua: req.headers['user-agent'] }).catch(() => {});
    });

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  }
);

router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router;
