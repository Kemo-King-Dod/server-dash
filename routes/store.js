const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/getStores', auth, async (req, res) => {
    try {

        const id = req.userId
        const stores = await Store.find({}, { password: 0, items: 0 })

        console.log(req.headers)
        if (req.headers.headers && req.headers.headers == 'true') {
            res.status(200).json({
                error: false,
                data: stores
            })
            return
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

        for (let i = 0; i < stores.length; i++) {
            console.log(stores[i])
        }


        res.status(200).json({
            error: false,
            data: stores
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

module.exports = router