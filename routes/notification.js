const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth')
const notification = require("../database/notification")

// Mark notification as read
router.get('/notification', auth, async (req, res) => {
    try {
        const data = await (await notification.find({ id: req.userId })).reverse()
        res.json({
            error: false,
            data
        })

        for (let i = 0; i < data.length; i++) {
            data.isread = true
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})

router.post('/deleteNotification', auth, async (req, res) => {
    try {
        await notification.findByIdAndDelete(req.body.id)
        res.json({
            error: false,
            message: 'تم حذف الإشعار بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في حذف الإشعار'
        });
    }
})

router.post('/deleteAllNotifications', auth, async (req, res) => {
    try {
        await notification.deleteMany({ id: req.userId })
        res.json({
            error: false,
            message: 'تم حذف الإشعارات بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في حذف الإشعار'
        });
    }
})

module.exports = router; 