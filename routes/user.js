const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.post('/addAddress', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: id })
        user.locations.push({
            title: req.body.name,
            description: req.body.description,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        })

        await user.save()
        res.status(500).json({
            error: false,
            data: 'تم حفظ الموقع بنجاح'
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

router.patch('/deleteAddress', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: id })

        for (var i = 0; i < user.locations.length; i++) {
            if (user.locations.title == req.body.title) {
                user.locations.splice(i, 1)
                break
            }
        }
        await user.save()
        res.status(500).json({
            error: false,
            data: 'تم حذف الموقع بنجاح'
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