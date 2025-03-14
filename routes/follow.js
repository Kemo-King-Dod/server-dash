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
            return res.status(404).json({
                error: true,
                message: 'المحل غير موجود'
            });
        }

        if (user.followedStores.includes(store._id)) {
            return res.status(409).json({
                error: true,
                data: 'المتجر تم متابعته بالفعل'
            });
        }


        user.followedStores.push(store._id);
        await user.save();
        await Store.findByIdAndUpdate(id, { $inc: { followersNumber: 1 } });

        res.status(200).json({
            error: false,
            data: 'تمت الإضافة إلى المتابعة'
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
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
                await Store.findByIdAndUpdate(id, { $inc: { followersNumber: -1 } })
                return res.status(200).json({
                    error: false,
                    data: 'تم حذف المحل من المتابعة بنجاح'
                });
            }
        }

        res.status(200).json({
            error: false,
            data: 'المحل غير موجود في المتابعة'
        });
    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في حذف المحل من المتابعة'
        });
    }
});

router.get('/MostFollowedStores', auth, async (req, res) => {
    try {
        const stores = await Store.find({}).sort({ followersNumber: -1 }).limit(4);
        res.status(200).json({
            error: false,
            data: stores
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

module.exports = router