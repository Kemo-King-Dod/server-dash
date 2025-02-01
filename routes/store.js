const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const { auth } = require('../middleware/auth')

router.get('/getStores', auth, async (req, res) => {
    try {
        const stores = await Store.find()
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