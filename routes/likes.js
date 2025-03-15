const express = require('express');
const router = express.Router();
const Item = require('../database/items');
const User = require('../database/users');
const Store = require('../database/store');
const { auth } = require('../middleware/auth');

// Get all favorites
router.get('/getLikeitems', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        for (var i = 0; i < user.likedItems.length; i++) {
            user.likedItems[i].like = true;
        }

        res.status(200).json({
            error: false,
            data: user.likedItems
        });
    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في جلب العناصر'
        });
    }
});

// Like an item
router.post('/like', auth, async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const userId = req.userId;

        // Check if item exists
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if user already liked the item
        const user = await User.findById(userId);
        if (user.likedItems.includes(itemId)) {
            return res.status(400).json({ error: true, message: 'Item already liked' });
        }

        // Add item to user's liked items
        user.likedItems.push(itemId);
        await user.save();

        // Increment item's like count
        item.likes += 1;
        await item.save();

        res.status(200).json({ error: false, message: 'Item liked successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Dislike (unlike) an item
router.post('/unlike', auth, async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const userId = req.userId;

        // Check if item exists
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: true, message: 'Item not found' });
        }

        // Check if user has liked the item
        const user = await User.findById(userId);
        if (!user.likedItems.includes(itemId)) {
            return res.status(400).json({ error: true, message: 'Item not liked yet' });
        }

        // Remove item from user's liked items
        user.likedItems = user.likedItems.filter(id => id.toString() !== itemId);
        await user.save();

        // Decrement item's like count
        item.likes = Math.max(0, item.likes - 1); // Ensure likes don't go below 0
        await item.save();

        res.status(200).json({ error: false, message: 'Item unliked successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get top 4 most liked items
router.get('/mostLiked', async (req, res) => {
    try {
        const topItems = await Item.find()
            .sort({ likes: -1 }) // Sort by likes in descending order
            .limit(10);           // Get only 4 items

        for (var i = 0; i < topItems.length; i++) {
            var itemStore = await Store.findById(topItems[i].storeID);
            topItems[i]._doc.storeName = itemStore.name;
            topItems[i]._doc.storeImage = itemStore.picture;
        }

        console.log(topItems[0]);


        res.status(200).json({ error: false, data: topItems });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: true, message: error.message });
    }
});

module.exports = router;