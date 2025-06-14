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
            data[i].isRead = true
            data[i].save()
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})

// Get count of unread notifications
router.get("/notificationCount", auth, async (req, res) => {
    try {
        // Get count of unread notifications for the authenticated user
        const count = await notification.countDocuments({
            id: req.userId,
            isRead: false
        });

        return res.json({
            error: false,
            data: {
                count
            }
        });
    } catch (error) {
        // Log error for debugging
        console.error('Error getting notification count:', error);

        return res.status(500).json({
            error: true,
            message: 'Failed to get notification count'
        });
    }
});

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