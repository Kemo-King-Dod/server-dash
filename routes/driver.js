const express = require('express');
const router = express.Router();
const Driver = require('../database/driver')
const { auth } = require('../middleware/auth')

router.get('/getDriver', auth, async (req, res) => {
    try {
        const driver = await Driver.findById(req.userId, { password: false })
        res.status(200).json({
            error: false,
            data: driver
        })
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
})

module.exports = router