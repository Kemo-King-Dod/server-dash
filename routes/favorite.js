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

        const items = await Items.find({ _id: { $in: user.favorateItems } })

        for (var i = 0; i < items.length; i++) {
            items[i].isFavorite = true;
        }

        res.status(200).json({
            error: false,
            data: user.favorateItems
        });
    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في جلب المفضلة'
        });
    }
})

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

        for (let i = 0; i < user.favorateItems.length; i++) {
            if (user.favorateItems[i].toString() == item._id.toString()) {
                throw new Error();
            }
        }


        user.favorateItems.push(item._id)
        await user.save();

        res.status(200).json({
            error: false,
            data: user.favorateItems
        });
    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في إضافة المنتج للمفضلة'
        });
    }
})

// Remove from favorites
router.post('/deleteFromFavoriveitems', auth, async (req, res) => {
    try {
        const id = req.body.id;
        const userId = req.userId;

        const user = await User.findById(userId);

        for (let i = 0; i < user.favorateItems.length; i++) {
            if (user.favorateItems[i].toString() == id) {
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
        res.status(200).json({
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

        const stores = await Store.find({ _id: { $in: user.favorateStors } })

        for (var i = 0; i < stores.length; i++) {
            stores[i].isFavorite = true;
            stores[i].password = '0';
            stores[i].items = null;
        }

        res.status(200).json({
            error: false,
            data: user.favorateStors
        });
    } catch (error) {
        res.status(200).json({
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
                message: 'المحل غير موجود'
            });
        }

        for (let i = 0; i < user.favorateStors.length; i++) {
            if (user.favorateStors[i].toString() == store._id.toString()) {
                throw new Error();
            }
        }

        user.favorateStors.push(store._id);
        await user.save()

        res.status(200).json({
            error: false,
            data: 'تمت الإضافة إلى المفضلة'
        });
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            error: true,
            message: error.message
        });
    }
});

// Remove from favorites
router.post('/deleteFromFavorivestores', auth, async (req, res) => {
    try {
        console.log('/deleteFromFavorivestores')
        const id = req.body.id;
        const userId = req.userId;

        const user = await User.findById(userId);

        let flag = false
        for (let i = 0; i < user.favorateStors.length; i++) {
            if (user.favorateStors[i].toString() == id.toString()) {
                user.favorateStors.splice(i, 1)
                flag = true
                break
            }
        }

        if (flag) {
            await user.save()
            res.status(200).json({
                error: false,
                data: 'تم حذف المحل من المفضلة بنجاح'
            });
        }
        else {
            res.status(200).json({
                error: false,
                data: 'المحل غير موجود في المفضلة'
            });
        }



    } catch (error) {
        res.status(200).json({
            error: true,
            data: 'حدث خطأ في حذف المحل من المفضلة'
        });
    }
});

module.exports = router;