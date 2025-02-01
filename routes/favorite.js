const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');
const Items = require('../database/items');
const Store = require('../database/store');

// Get all favorites
router.get('/getFavoriveitems', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        for (var i = 0; i < user.favorateItems.length; i++) {
            user.favorateItems[i].isFavorite = true;
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
router.post('/addToFavoriveitems', auth, async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId)
        const item = await Items.findOne({ _id: id })
        if (!item) {
            res.status(200).json({
                error: true,
                message: 'العنصر غير موجود'
            });
        }


        user.favorateItems.push(item);
        await user.save();

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
router.post('/deleteFromFavoriveitems', auth, async (req, res) => {
    try {
        const id = req.body.id;
        const userId = req.userId;

        const user = await User.findById(userId);

        for (let i = 0; i < user.favorateItems.length; i++) {
            if (user.favorateItems[i]._id.toString() == id) {
                user.favorateItems.splice(i, 1)
                break
            }
        }
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



// shops
router.get('/getFavorivestores', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        res.status(200).json({
            error: false,
            data: user.favorateStors
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ في جلب المفضلة'
        });
    }
});

// Add to favorites
router.post('/addToFavorivestores', auth, async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId)
        const store = await Store.findOne({ _id: id })
        if (!store) {
            res.status(200).json({
                error: true,
                message: 'العنصر غير موجود'
            });
        }


        user.favorateStors.push(store);
        await user.save();

        res.status(200).json({
            error: false,
            data: user.favorateStors
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ في إضافة المنتج للمفضلة'
        });
    }
});

// Remove from favorites
router.delete('/deleteFromFavorivestores', auth, async (req, res) => {
    try {
        const id = req.body.id;
        const userId = req.userId;

        const user = await User.findById(userId);

        for (let i = 0; i < user.favorateStors.length; i++) {
            if (user.favorateStors[i]._id.toString() == id) {
                user.favorateStors.splice(i, 1)
                break
            }
        }
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