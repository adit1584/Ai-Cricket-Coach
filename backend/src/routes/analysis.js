const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Video = require('../models/Video');
const Analysis = require('../models/Analysis');

// POST /api/analysis/callback — called by Python AI service when done
router.post('/callback', async (req, res) => {
  const { video_id, metrics, issues, strengths, tips, raw_feedback, error } = req.body;

  if (!video_id) {
    return res.status(400).json({ message: 'video_id is required.' });
  }

  const video = await Video.findById(video_id);
  if (!video) {
    return res.status(404).json({ message: 'Video not found.' });
  }

  if (error) {
    video.status = 'failed';
    await video.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`video_${video_id}`).emit('analysis_failed', { video_id, error });
    }
    return res.json({ message: 'Analysis marked as failed.' });
  }

  // Create or update analysis
  const analysis = await Analysis.findOneAndUpdate(
    { video_id },
    {
      video_id,
      metrics: metrics || {},
      issues: issues || [],
      strengths: strengths || [],
      tips: tips || [],
      raw_feedback: raw_feedback || '',
    },
    { upsert: true, new: true }
  );

  video.status = 'done';
  await video.save();

  // Emit socket event to all clients watching this video
  const io = req.app.get('io');
  if (io) {
    io.to(`video_${video_id}`).emit('analysis_complete', {
      video_id,
      analysis,
    });
  }

  res.json({ message: 'Analysis saved.', analysis });
});

// GET /api/analysis/:videoId
router.get('/:videoId', protect, async (req, res) => {
  const analysis = await Analysis.findOne({ video_id: req.params.videoId });
  if (!analysis) {
    return res.status(404).json({ message: 'Analysis not found yet.' });
  }
  res.json({ analysis });
});

module.exports = router;
