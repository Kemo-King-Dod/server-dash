const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Ordre = require('../database/orders');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/getStore', auth, async (req, res) => {
    try {
        const id = req.userId
        const store = await Store.findById(id, { password: 0, items: 0 })
        res.status(200).json({
            error: false,
            data: store
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.get('/getStores', auth, async (req, res) => {
    try {

        const id = req.userId
        const stores = await Store.find({}, { password: 0, items: 0 })

        if (req.headers.isvisiter && req.headers.isvisiter == 'true') {
            return res.status(200).json({
                error: false,
                data: stores
            })
        }

        // Add isFavorite property to each item
        for (var i = 0; i < stores.length; i++) {
            stores[i]._doc.isFavorite = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < stores.length; i++) {
                for (var j = 0; j < user.favorateStors.length; j++) {
                    if (user.favorateStors[j]._id.toString() == stores[i]._id.toString()) {
                        stores[i]._doc.isFavorite = true;
                    }
                }
            }
        }


        // Add isFollow property to each store
        for (var i = 0; i < stores.length; i++) {
            stores[i]._doc.isFollow = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < stores.length; i++) {
                for (var j = 0; j < user.followedStores.length; j++) {
                    if (user.followedStores[j].toString() == stores[i]._id.toString()) {
                        stores[i]._doc.isFollow = true;
                    }
                }
            }
        }

        for (let i = 0; i < stores.length; i++) {
            console.log(stores[i]._doc.isFollow)
        }

        res.status(200).json({
            error: false,
            data: stores
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})


router.post('/alterStorePassword', auth, async (req, res) => {
    try {
        const userId = req.userId
        const store = await Store.findById(userId)
        const valied = await bcrypt.compare(req.body.currentPassword, store.password)
        if (valied) {
            const salt = await bcrypt.genSalt(10)
            store.password = await bcrypt.hash(req.body.newPassword, salt)
            await store.save()
            res.status(200).json({
                error: false,
                message: 'تم تحديث كلمة المرور بنجاح'
            })
        }
        else {
            res.status(200).json({
                error: true,
                message: 'كلمة المرور الحالية غير صحيحة'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})


// alter name
router.post('/alterStore', auth, async (req, res) => {
    try {
        const userId = req.userId
        const store = await Store.findById(userId)
        store.name = req.body.name
        store.storeType = req.body.category
        store.picture = req.body.picture
        await store.save()

        await Ordre.updateMany({ "store.id": req.userId }, {
            "store.name": req.body.name,
            "store.category": req.body.category,
            "store.picture": req.body.picture
        })

        res.status(200).json({
            error: false,
            message: 'تم تحديث البيانات بنجاح'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

module.exports = router