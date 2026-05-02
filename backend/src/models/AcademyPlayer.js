const mongoose = require('mongoose');

const academyPlayerSchema = new mongoose.Schema({
  coach_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
  },
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  batch_name: {
    type: String,
    trim: true,
    default: 'General',
  },
  joined_date: {
    type: Date,
    default: Date.now,
  },
});

// Unique constraint: a player can only be in one academy per coach
academyPlayerSchema.index({ coach_id: 1, player_id: 1 }, { unique: true });

module.exports = mongoose.model('AcademyPlayer', academyPlayerSchema);
