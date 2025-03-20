const express = require('express');
const router = express.Router();
const Store = require('../database/store');
const { auth } = require('../middleware/auth')


router.post('/notifications', auth, async (req, res) => {
    try {
        const id = req.userId
        const status = req.body.status
        await Store.findByIdAndUpdate(id, { notificationsCondition: status })
        res.status(200).json({
            error: false,
            message: 'تمت العملية بنجاح'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.post('/openCondition', auth, async (req, res) => {
    try {
        const id = req.userId
        const status = req.body.status
        await Store.findByIdAndUpdate(id, { openCondition: status })
        res.status(200).json({
            error: false,
            message: 'تمت العملية بنجاح'
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