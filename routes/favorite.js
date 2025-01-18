const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Get all favorites for a user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const favorites = await Favorite.find({ userId });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// Add a new favorite
router.post('/', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.userId;

    const newFavorite = new Favorite({
      userId,
      itemId,
    });

    await newFavorite.save();
    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(500).json({ message: 'Error adding favorite', error: error.message });
  }
});

// Remove a favorite
router.delete('/:id', auth, async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.userId;

    const result = await Favorite.findOneAndDelete({
      _id: favoriteId,
      userId: userId
    });

    if (!result) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing favorite', error: error.message });
  }
});

module.exports = router;
