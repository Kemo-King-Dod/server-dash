const express = require('express');
const router = express.Router();
const Item = require('../database/items');
const User = require('../database/users');
const jwt = require('jsonwebtoken');
const Retrenchments = require('../database/Retrenchments')
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
        const data = await Item.find()
            .sort({ likes: -1 }) // Sort by likes in descending order
            .limit(10);           // Get only 4 items

        var id = null;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
            const decoded = jwt.verify(token, JWT_SECRET);
            id = decoded.id;
        }

        let discoundIds = []

        for (let i = 0; i < data.length; i++) {
            if (data[i].retrenchment_end < Date.now()) {
                discoundIds.push(data[i]._id)
                data[i].retrenchment_end = null
                data[i].retrenchment_percent = null
                data[i].is_retrenchment = false
                await Item.findByIdAndUpdate(data[i]._id, {
                    $set: {
                        retrenchment_end: null,
                        retrenchment_percent: null,
                        is_retrenchment: false
                    }
                })
            }
        }

        // delete if retrenchment_end is bigger than or equl now
        Retrenchments.deleteMany(
            {
                retrenchment_end: { $lt: Date.now() },
            }
        )


        if (req.headers.isvisiter && req.headers.isvisiter == "true") {
            res.json({ error: false, items: data });
            return;
        }

        // Add isFavorite property to each item
        for (var i = 0; i < data.length; i++) {
            data[i]._doc.isFavorite = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < user.favorateItems.length; j++) {
                    if (user.favorateItems[j] == null) continue;
                    if (user.favorateItems[j].toString() == data[i]._id.toString()) {
                        data[i]._doc.isFavorite = true;
                    }
                }
            }
        }

        // Add like property to each item
        for (var i = 0; i < data.length; i++) {
            data[i]._doc.like = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < user.likedItems.length; j++) {
                    if (user.likedItems[j] == null) continue;
                    if (user.likedItems[j].toString() == data[i]._id.toString()) {
                        data[i]._doc.like = true;
                    }
                }
            }
        }

        res.status(200).json({ error: false, data: data });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: true, message: error.message });
    }
})

module.exports = router;