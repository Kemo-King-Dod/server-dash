const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');
const Store = require('../database/store');

// Add to favorites
router.post('/followStore', auth, async (req, res) => {
    try {
        const { id } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId)
        const store = await Store.findOne({ _id: id }, { password: 0 })
        if (!store) {
            res.status(200).json({
                error: true,
                message: 'المحل غير موجود'
            });
        }

        for (let i = 0; i < user.followedStores.length; i++) {
            if (user.followedStores[i].toString() == store._id.toString()) {
                return res.status(200).json({
                    error: true,
                    data: 'المتجر تم متابعته بالفعل'
                });
            }
        }

        user.followedStores.push(store._id);
        await user.save();

        res.status(200).json({
            error: false,
            data: 'تمت الإضافة إلى المفضلة'
        });
    } catch (error) {
        console.log(error)
        res.status(200).json({
            error: true,
            message: error.message
        });
    }
});

// Remove from favorites
router.post('/unFollow', auth, async (req, res) => {
    try {
        const id = req.body.id;
        const userId = req.userId;
        const user = await User.findById(userId);

        for (let i = 0; i < user.followedStores.length; i++) {
            if (user.followedStores[i].toString() == id.toString()) {
                user.followedStores.splice(i, 1)
                await user.save()
                return res.status(200).json({
                    error: false,
                    data: 'تم حذف المحل من المفضلة بنجاح'
                });
            }
        }

        res.status(200).json({
            error: false,
            data: 'المحل غير موجود في المفضلة'
        });
    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في حذف المحل من المفضلة'
        });
    }
});

module.exports = router