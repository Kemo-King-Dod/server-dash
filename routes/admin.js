const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/adminGetStores', auth, async (req, res) => {
    try {
        const stores = await Store.find({}, { password: false })
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

router.get('/adminGetDrivers', auth, async (req, res) => {
    try {
        const drivers = await Driver.find({}, { password: false })
        res.status(200).json({
            error: false,
            data: drivers
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

router.get('/adminGetUsers', auth, async (req, res) => {
    try {
        const users = await User.find({}, { password: false })
        res.status(200).json({
            error: false,
            data: users
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})


router.post('/adminStoreState', auth, async (req, res) => {
    try {
        const { targetUserId, state } = req.body;
        await Store.updateOne(
            { _id: targetUserId },
            { registerCondition: state }
        )
        
        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

router.post('/adminDriverState', auth, async (req, res) => {
    try {
        const { targetUserId, state } = req.body;

        await User.updateOne(
            { _id: targetUserId },
            { registerCondition: state }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

router.post('/adminUserState', auth, async (req, res) => {
    try {
        const { targetUserId, state } = req.body;

        await Driver.updateOne(
            { _id: targetUserId },
            { registerCondition: state }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
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