const mongoose = require('mongoose');

const SHOT_TYPES = [
  'cover_drive',
  'pull_shot',
  'straight_drive',
  'cut_shot',
  'bowling_action',
  'footwork',
];

const videoSchema = new mongoose.Schema({
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  video_url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String, // Cloudinary public_id for deletion
    required: true,
  },
  shot_type: {
    type: String,
    enum: SHOT_TYPES,
    required: [true, 'Shot type is required'],
  },
  status: {
    type: String,
    enum: ['processing', 'done', 'failed'],
    default: 'processing',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

videoSchema.statics.SHOT_TYPES = SHOT_TYPES;

module.exports = mongoose.model('Video', videoSchema);
