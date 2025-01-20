const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');

// Get all favorites
router.get('/getfavorive', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }

        res.status(200).json({
            error: false,
            data: user.favorateItems
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ في جلب المفضلة'
        });
    }
});

// Add to favorites
router.post('/addToFavorive', auth, async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }

        if (!user.favorateItems.includes(itemId)) {
            user.favorateItems.push(itemId);
            await user.save();
        }

        res.status(200).json({
            error: false,
            data: user.favorateItems
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ في إضافة المنتج للمفضلة'
        });
    }
});

// Remove from favorites
router.delete('/deleteFromFavorive', auth, async (req, res) => {
    try {
        const itemId = req.body.id;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }

        const favoriteIndex = user.favorateItems.indexOf(itemId);
        if (favoriteIndex === -1) {
            return res.status(404).json({
                error: true,
                data: 'المنتج غير موجود في المفضلة'
            });
        }

        user.favorateItems.splice(favoriteIndex, 1);
        await user.save();

        res.status(200).json({
            error: false,
            data: 'تم حذف المنتج من المفضلة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ في حذف المنتج من المفضلة'
        });
    }
});

module.exports = router;
