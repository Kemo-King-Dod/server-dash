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

router.post('/alterDriverPassword', auth, async (req, res) => {
    try {
        const userId = req.userId
        const driver = await Driver.findById(userId)
        const valied = await bcrypt.compare(req.body.currentPassword, driver.password)
        if (valied) {
            const salt = await bcrypt.genSalt(10)
            driver.password = await bcrypt.hash(req.body.newPassword, salt)
            await driver.save()
            res.status(200).json({
                error: false,
                message: 'تم تحديث كلمة المرور بنجاح'
            })
        }
        else {
            res.status(200).json({
                error: true,
                message: 'كلمة المرور الحالية غير صحيحة'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

module.exports = router