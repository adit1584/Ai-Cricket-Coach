const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  academy_name: {
    type: String,
    required: [true, 'Academy name is required'],
    trim: true,
  },
  certification: {
    type: String,
    trim: true,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Coach', coachSchema);
