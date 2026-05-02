const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    unique: true,
  },
  metrics: {
    head_movement: { type: Number, default: null },
    knee_angle: { type: Number, default: null },
    balance_score: { type: Number, default: null },
    elbow_angle: { type: Number, default: null },
    hip_rotation: { type: Number, default: null },
    stride_length: { type: Number, default: null },
    follow_through_score: { type: Number, default: null },
  },
  issues: [{ type: String }],
  strengths: [{ type: String }],
  tips: [{ type: String }],
  raw_feedback: { type: String, default: '' }, // Raw HF output for debugging
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Analysis', analysisSchema);
