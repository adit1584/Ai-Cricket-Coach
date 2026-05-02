const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const Video = require('../models/Video');
const Analysis = require('../models/Analysis');
const Player = require('../models/Player');
const Coach = require('../models/Coach');
const AcademyPlayer = require('../models/AcademyPlayer');
const User = require('../models/User');

// GET /api/analytics/player/:id
router.get('/player/:id', protect, async (req, res) => {
  const { id } = req.params; // This is Player._id

  // Authorization: player can only see own data, coach can see academy players
  if (req.user.role === 'player') {
    const playerProfile = await Player.findOne({ user_id: req.user._id });
    if (!playerProfile || playerProfile._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  } else if (req.user.role === 'coach') {
    const coachProfile = await Coach.findOne({ user_id: req.user._id });
    const relation = await AcademyPlayer.findOne({ coach_id: coachProfile._id, player_id: id });
    if (!relation) return res.status(403).json({ message: 'Player not in your academy.' });
  }

  // All videos for this player
  const videos = await Video.find({ player_id: id, status: 'done' }).sort({ created_at: 1 });
  const videoIds = videos.map((v) => v._id);

  // All analyses for these videos
  const analyses = await Analysis.find({ video_id: { $in: videoIds } });

  // Map analysis by video_id for quick lookup
  const analysisMap = {};
  analyses.forEach((a) => { analysisMap[a.video_id.toString()] = a; });

  // Video count
  const video_count = await Video.countDocuments({ player_id: id });

  // Progress over time — group by shot_type, sorted by date
  const progress = {};
  videos.forEach((v) => {
    const a = analysisMap[v._id.toString()];
    if (!a) return;
    if (!progress[v.shot_type]) progress[v.shot_type] = [];
    progress[v.shot_type].push({
      date: v.created_at,
      metrics: a.metrics,
      video_id: v._id,
    });
  });

  // Weakness tracker — frequency of issues
  const weaknesses = {};
  analyses.forEach((a) => {
    a.issues.forEach((issue) => {
      weaknesses[issue] = (weaknesses[issue] || 0) + 1;
    });
  });

  // Strength tracker — frequency of strengths
  const strengths = {};
  analyses.forEach((a) => {
    a.strengths.forEach((strength) => {
      strengths[strength] = (strengths[strength] || 0) + 1;
    });
  });

  // Improvement: latest value vs avg of previous N (per shot type, per metric)
  const improvements = {};
  Object.keys(progress).forEach((shotType) => {
    const records = progress[shotType];
    if (records.length < 2) return;
    const latest = records[records.length - 1].metrics;
    const previous = records.slice(0, -1);
    improvements[shotType] = {};
    Object.keys(latest).forEach((metric) => {
      if (latest[metric] === null || latest[metric] === undefined) return;
      const prevValues = previous.map((r) => r.metrics[metric]).filter((v) => v !== null && v !== undefined);
      if (prevValues.length === 0) return;
      const avg = prevValues.reduce((sum, v) => sum + v, 0) / prevValues.length;
      improvements[shotType][metric] = {
        latest: latest[metric],
        avg_previous: Math.round(avg * 100) / 100,
        delta: Math.round((latest[metric] - avg) * 100) / 100,
      };
    });
  });

  res.json({ video_count, progress, weaknesses, strengths, improvements });
});

// GET /api/analytics/coach/:id
router.get('/coach/:id', protect, requireRole('coach'), async (req, res) => {
  const { id } = req.params; // Coach._id

  const coachProfile = await Coach.findById(id);
  if (!coachProfile || coachProfile.user_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  // Get all academy players
  const academyRelations = await AcademyPlayer.find({ coach_id: id }).populate('player_id');

  const playerIds = academyRelations.map((r) => r.player_id._id);

  // Get videos for all players
  const videos = await Video.find({ player_id: { $in: playerIds }, status: 'done' });
  const videoIds = videos.map((v) => v._id);

  // Get all analyses
  const analyses = await Analysis.find({ video_id: { $in: videoIds } });
  const analysisMap = {};
  analyses.forEach((a) => { analysisMap[a.video_id.toString()] = a; });

  // Group by batch
  const batchMap = {};
  academyRelations.forEach((rel) => {
    const batchName = rel.batch_name || 'General';
    if (!batchMap[batchName]) batchMap[batchName] = [];
    batchMap[batchName].push(rel.player_id._id.toString());
  });

  const batches = Object.keys(batchMap).map((name) => ({
    batch_name: name,
    player_ids: batchMap[name],
    player_count: batchMap[name].length,
  }));

  // Player stats summary
  const players = await Promise.all(
    academyRelations.map(async (rel) => {
      const player = rel.player_id;
      const playerUser = await User.findById(player.user_id);
      const playerVideos = videos.filter((v) => v.player_id.toString() === player._id.toString());
      const playerAnalyses = playerVideos.map((v) => analysisMap[v._id.toString()]).filter(Boolean);

      // Avg metrics for this player
      const avgMetrics = {};
      const metricKeys = ['head_movement', 'knee_angle', 'balance_score', 'elbow_angle', 'hip_rotation'];
      metricKeys.forEach((key) => {
        const values = playerAnalyses.map((a) => a.metrics[key]).filter((v) => v !== null && v !== undefined);
        avgMetrics[key] = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100 : null;
      });

      return {
        player_id: player._id,
        name: playerUser ? playerUser.name : 'Unknown',
        batch_name: rel.batch_name || 'General',
        video_count: playerVideos.length,
        avg_metrics: avgMetrics,
      };
    })
  );

  // Overall avg metrics across all academy players
  const allAnalyses = Object.values(analysisMap);
  const avg_metrics = {};
  const metricKeys = ['head_movement', 'knee_angle', 'balance_score', 'elbow_angle', 'hip_rotation'];
  metricKeys.forEach((key) => {
    const values = allAnalyses.map((a) => a.metrics[key]).filter((v) => v !== null && v !== undefined);
    avg_metrics[key] = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100 : null;
  });

  res.json({
    batches,
    players,
    avg_metrics,
    total_videos: videos.length,
    total_players: playerIds.length,
  });
});

// GET /api/analytics/coach/:id/player/:playerId — single player stats for coach
router.get('/coach/:id/player/:playerId', protect, requireRole('coach'), async (req, res) => {
  const { id, playerId } = req.params;

  const coachProfile = await Coach.findById(id);
  if (!coachProfile || coachProfile.user_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const relation = await AcademyPlayer.findOne({ coach_id: id, player_id: playerId });
  if (!relation) return res.status(403).json({ message: 'Player not in your academy.' });

  // Delegate to player analytics logic
  const videos = await Video.find({ player_id: playerId, status: 'done' }).sort({ created_at: 1 });
  const videoIds = videos.map((v) => v._id);
  const analyses = await Analysis.find({ video_id: { $in: videoIds } });
  const analysisMap = {};
  analyses.forEach((a) => { analysisMap[a.video_id.toString()] = a; });

  const progress = {};
  videos.forEach((v) => {
    const a = analysisMap[v._id.toString()];
    if (!a) return;
    if (!progress[v.shot_type]) progress[v.shot_type] = [];
    progress[v.shot_type].push({ date: v.created_at, metrics: a.metrics, video_id: v._id });
  });

  const weaknesses = {};
  const strengths = {};
  analyses.forEach((a) => {
    a.issues.forEach((i) => { weaknesses[i] = (weaknesses[i] || 0) + 1; });
    a.strengths.forEach((s) => { strengths[s] = (strengths[s] || 0) + 1; });
  });

  res.json({ video_count: videos.length, progress, weaknesses, strengths });
});

module.exports = router;
