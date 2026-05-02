const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Player = require('../models/Player');
const Coach = require('../models/Coach');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role, age, experience_level, preferred_role, academy_name, certification } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Email, password, name, and role are required.' });
  }

  if (!['player', 'coach'].includes(role)) {
    return res.status(400).json({ message: 'Role must be player or coach.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const user = await User.create({ email, password_hash: password, name, role });

  if (role === 'player') {
    await Player.create({
      user_id: user._id,
      age: age || null,
      experience_level: experience_level || 'beginner',
      preferred_role: preferred_role || 'batter',
    });
  } else if (role === 'coach') {
    if (!academy_name) {
      await user.deleteOne();
      return res.status(400).json({ message: 'Academy name is required for coaches.' });
    }
    await Coach.create({
      user_id: user._id,
      academy_name,
      certification: certification || '',
    });
  }

  const token = signToken(user._id);

  res.status(201).json({
    message: 'Registration successful.',
    token,
    user: user.toJSON(),
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Fetch role-specific profile
  let profile = null;
  if (user.role === 'player') {
    profile = await Player.findOne({ user_id: user._id });
  } else {
    profile = await Coach.findOne({ user_id: user._id });
  }

  const token = signToken(user._id);

  res.json({
    message: 'Login successful.',
    token,
    user: user.toJSON(),
    profile,
  });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  const user = req.user;
  let profile = null;
  if (user.role === 'player') {
    profile = await Player.findOne({ user_id: user._id });
  } else {
    profile = await Coach.findOne({ user_id: user._id });
  }
  res.json({ user: user.toJSON(), profile });
});

module.exports = router;
