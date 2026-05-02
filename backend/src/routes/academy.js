const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const AcademyPlayer = require('../models/AcademyPlayer');
const Player = require('../models/Player');
const Coach = require('../models/Coach');
const User = require('../models/User');

// POST /api/academy/add-player — coach adds a player by email
router.post('/add-player', protect, requireRole('coach'), async (req, res) => {
  const { player_email, batch_name } = req.body;

  if (!player_email) {
    return res.status(400).json({ message: 'Player email is required.' });
  }

  // Find user by email
  const playerUser = await User.findOne({ email: player_email, role: 'player' });
  if (!playerUser) {
    return res.status(404).json({ message: 'No player found with that email.' });
  }

  const playerProfile = await Player.findOne({ user_id: playerUser._id });
  if (!playerProfile) {
    return res.status(404).json({ message: 'Player profile not found.' });
  }

  const coachProfile = await Coach.findOne({ user_id: req.user._id });
  if (!coachProfile) {
    return res.status(404).json({ message: 'Coach profile not found.' });
  }

  // Check for duplicate
  const existing = await AcademyPlayer.findOne({
    coach_id: coachProfile._id,
    player_id: playerProfile._id,
  });

  if (existing) {
    return res.status(409).json({ message: 'Player already in your academy.' });
  }

  const relation = await AcademyPlayer.create({
    coach_id: coachProfile._id,
    player_id: playerProfile._id,
    batch_name: batch_name || 'General',
  });

  res.status(201).json({
    message: 'Player added to academy.',
    relation,
    player: { id: playerProfile._id, name: playerUser.name, email: playerUser.email },
  });
});

// GET /api/academy/players — list all players in coach's academy
router.get('/players', protect, requireRole('coach'), async (req, res) => {
  const coachProfile = await Coach.findOne({ user_id: req.user._id });
  if (!coachProfile) {
    return res.status(404).json({ message: 'Coach profile not found.' });
  }

  const relations = await AcademyPlayer.find({ coach_id: coachProfile._id }).populate('player_id');

  const players = await Promise.all(
    relations.map(async (rel) => {
      const user = await User.findById(rel.player_id.user_id).select('name email');
      return {
        academy_player_id: rel._id,
        player_id: rel.player_id._id,
        name: user ? user.name : 'Unknown',
        email: user ? user.email : '',
        batch_name: rel.batch_name,
        joined_date: rel.joined_date,
        experience_level: rel.player_id.experience_level,
        preferred_role: rel.player_id.preferred_role,
      };
    })
  );

  res.json({ players, coach: { id: coachProfile._id, academy_name: coachProfile.academy_name } });
});

// PATCH /api/academy/players/:playerId/batch — update batch name
router.patch('/players/:playerId/batch', protect, requireRole('coach'), async (req, res) => {
  const { batch_name } = req.body;
  const coachProfile = await Coach.findOne({ user_id: req.user._id });

  const relation = await AcademyPlayer.findOneAndUpdate(
    { coach_id: coachProfile._id, player_id: req.params.playerId },
    { batch_name },
    { new: true }
  );

  if (!relation) {
    return res.status(404).json({ message: 'Player not found in your academy.' });
  }

  res.json({ message: 'Batch updated.', relation });
});

// DELETE /api/academy/players/:playerId — remove player from academy
router.delete('/players/:playerId', protect, requireRole('coach'), async (req, res) => {
  const coachProfile = await Coach.findOne({ user_id: req.user._id });

  const result = await AcademyPlayer.findOneAndDelete({
    coach_id: coachProfile._id,
    player_id: req.params.playerId,
  });

  if (!result) {
    return res.status(404).json({ message: 'Player not found in your academy.' });
  }

  res.json({ message: 'Player removed from academy.' });
});

module.exports = router;
