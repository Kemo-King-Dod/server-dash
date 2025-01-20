const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/adminGetStores', auth, async (req, res) => {
    console.log(1)
    try {
        const stores = await Store.find({}, { password: false })
        console.log(stores[i].picture)
        console.log(stores[i])
        // for (var i = 0; i < stores.length; i++) {
        //     Reflect.deleteProperty(stores[i], 'password')
        // }
        console.log(stores)
        res.status(200).json({
            error: false,
            data: stores
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل البيانات'
        })
    }
})

router.get('/adminGetDrivers', auth, async (req, res) => {
    try {
        const drivers = await Driver.find({}, { password: false })
        // for (var i = 0; i < drivers.length; i++) {
        //     Reflect.deleteProperty(drivers[i], 'password')
        // }
        res.status(200).json({
            error: false,
            data: drivers
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل البيانات'
        })
    }
})

router.get('/adminGetUsers', auth, async (req, res) => {
    try {
        const users = await User.find({}, { password: false })
        // for (var i = 0; i < users.length; i++) {
        //     Reflect.deleteProperty(users[i], 'password')
        // }
        res.status(200).json({
            error: false,
            data: users
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل البيانات'
        })
    }
})


router.post('/adminacceptordenystore', auth, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        await Store.updateOne(
            { _id: targetUserId },
            { registerCondition: req.body.condition }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل حالة التسجيل'
        })
    }
})

router.post('/adminacceptordenyuser', auth, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        await User.updateOne(
            { _id: targetUserId },
            { registerCondition: req.body.condition }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل حالة التسجيل'
        })
    }
})

router.post('/adminacceptordenydriver', auth, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        await Driver.updateOne(
            { _id: targetUserId },
            { registerCondition: req.body.condition }
        )

        res.json({
            error: false,
            message: 'تم إلغاء التسجيل'
        })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'حدث خطأ في تحميل حالة التسجيل'
        })
    }
})

module.exports = router