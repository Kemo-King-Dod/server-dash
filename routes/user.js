const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/addAddress', auth, async (req, res) => {
    try {
        const user = await User.find()
        if (!user)
            res.status(401).json({
                error: true,
                message: 'المستخدم غير موجود'
            })
        user.locations.push({
            title: req.body.name,
            description: req.body.description,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        })

        await user.save()
        res.status(200).json({
            error: true,
            message: 'تم حفظ الموقع بنجاح'
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