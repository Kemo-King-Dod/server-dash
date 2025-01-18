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


module.exports = router