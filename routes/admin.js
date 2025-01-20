const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const {auth} = require('../middleware/auth')

router.post('/adminGetStores', auth, async (req, res) => {
    try {
        const stores = await Store.find()
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

router.post('/adminGetDrivers', auth, async (req, res) => {
    try {
        const drivers = await Driver.find()
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

router.post('/adminGetUsers', auth, async (req, res) => {
    try {
        const users = await User.find()
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