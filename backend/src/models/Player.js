const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    min: 5,
    max: 100,
  },
  experience_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'professional'],
    default: 'beginner',
  },
  preferred_role: {
    type: String,
    enum: ['batter', 'bowler', 'all-rounder', 'wicket-keeper'],
    default: 'batter',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Player', playerSchema);
