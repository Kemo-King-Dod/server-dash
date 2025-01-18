const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const auth = require('../middleware/auth')


router.post('/adminGetStores', auth, async (req, res) => {
    const stores = await Store.find()
    res.status(200).json({
        error: false,
        data: stores
    })
})

router.post('/adminGetDrivers', auth, async (req, res) => {
    const drivers = await Driver.find()
    res.status(200).json({
        error: false,
        data: drivers
    })
})

router.post('/adminGetUsers', auth, async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        error: false,
        data: users
    })
})


router.post('/adminacceptstore', auth, async (req, res) => {
    if (!req.body.userId) {
        return res.status(400).json({
            error: true,
            message: 'User ID is required'
        })
    }

    try {
        await Store.updateOne(
            { _id: req.body.userId },
            { registerCondition: 'active' }
        )

        res.json({
            error: false,
            message: 'Registration approved successfully'
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'Error updating registration status'
        })
    }
})

router.post('/admindenystore', auth, async (req, res) => {
    try {
        await Store.updateOne(
            { _id: req.body.userId },
            { registerCondition: 'denied' }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'Error updating registration status'
        })
    }
})

module.exports = router