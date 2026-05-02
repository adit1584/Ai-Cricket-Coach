const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, requireRole } = require('../middleware/auth');
const { upload } = require('../services/cloudinary');
const Video = require('../models/Video');
const Player = require('../models/Player');
const AcademyPlayer = require('../models/AcademyPlayer');
const Coach = require('../models/Coach');
const Analysis = require('../models/Analysis');

// POST /api/videos/upload
router.post('/upload', protect, upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded.' });
  }

  const { shot_type, player_id } = req.body;
  const validShotTypes = Video.SHOT_TYPES;

  if (!shot_type || !validShotTypes.includes(shot_type)) {
    return res.status(400).json({
      message: `Invalid shot_type. Valid types: ${validShotTypes.join(', ')}`,
    });
  }

  let targetPlayerId;

  if (req.user.role === 'player') {
    // Player uploads for themselves
    const playerProfile = await Player.findOne({ user_id: req.user._id });
    if (!playerProfile) {
      return res.status(404).json({ message: 'Player profile not found.' });
    }
    targetPlayerId = playerProfile._id;
  } else if (req.user.role === 'coach') {
    // Coach uploads for an academy player
    if (!player_id) {
      return res.status(400).json({ message: 'player_id is required for coach uploads.' });
    }

    const coachProfile = await Coach.findOne({ user_id: req.user._id });
    if (!coachProfile) {
      return res.status(404).json({ message: 'Coach profile not found.' });
    }

    // Verify player belongs to this coach's academy
    const academyRelation = await AcademyPlayer.findOne({
      coach_id: coachProfile._id,
      player_id,
    });

    if (!academyRelation) {
      return res.status(403).json({ message: 'Player does not belong to your academy.' });
    }

    targetPlayerId = player_id;
  }

  const video = await Video.create({
    player_id: targetPlayerId,
    uploaded_by: req.user._id,
    video_url: req.file.path,
    public_id: req.file.filename,
    shot_type,
    status: 'processing',
  });

  // Trigger AI analysis asynchronously
  try {
    const callbackUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/analysis/callback`;
    axios.post(`${process.env.PYTHON_SERVICE_URL}/analyze`, {
      video_url: video.video_url,
      shot_type: video.shot_type,
      video_id: video._id.toString(),
      callback_url: `http://localhost:${process.env.PORT || 5000}/api/analysis/callback`,
    }).catch((err) => {
      console.error('AI service error:', err.message);
    });
  } catch (err) {
    console.error('Failed to trigger analysis:', err.message);
  }

  // Emit socket event: analysis started
  const io = req.app.get('io');
  if (io) {
    io.to(`video_${video._id}`).emit('analysis_started', { video_id: video._id });
  }

  res.status(201).json({
    message: 'Video uploaded. Analysis started.',
    video_id: video._id,
    status: 'processing',
    video_url: video.video_url,
  });
});

// GET /api/videos/:id
router.get('/:id', protect, async (req, res) => {
  const video = await Video.findById(req.params.id).populate('player_id').populate('uploaded_by', 'name email');

  if (!video) {
    return res.status(404).json({ message: 'Video not found.' });
  }

  // Authorization check
  if (req.user.role === 'player') {
    const playerProfile = await Player.findOne({ user_id: req.user._id });
    if (!playerProfile || video.player_id._id.toString() !== playerProfile._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  } else if (req.user.role === 'coach') {
    const coachProfile = await Coach.findOne({ user_id: req.user._id });
    const academyRelation = await AcademyPlayer.findOne({
      coach_id: coachProfile._id,
      player_id: video.player_id._id,
    });
    if (!academyRelation) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  }

  const analysis = await Analysis.findOne({ video_id: video._id });

  res.json({ video, analysis });
});

// GET /api/videos/player/:playerId — list all videos for a player
router.get('/player/:playerId', protect, async (req, res) => {
  const { playerId } = req.params;

  if (req.user.role === 'player') {
    const playerProfile = await Player.findOne({ user_id: req.user._id });
    if (!playerProfile || playerProfile._id.toString() !== playerId) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  } else if (req.user.role === 'coach') {
    const coachProfile = await Coach.findOne({ user_id: req.user._id });
    const relation = await AcademyPlayer.findOne({ coach_id: coachProfile._id, player_id: playerId });
    if (!relation) {
      return res.status(403).json({ message: 'Player not in your academy.' });
    }
  }

  const videos = await Video.find({ player_id: playerId }).sort({ created_at: -1 });
  res.json({ videos });
});

module.exports = router;
