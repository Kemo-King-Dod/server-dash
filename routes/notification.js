const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// Get all notifications with pagination
router.get('/getnotification', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await NotificationService.getNotifications(
            req.user.id,
            req.user.type,
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            error: false,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في جلب الإشعارات'
        });
    }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(
            req.params.notificationId,
            req.user.id
        );

        res.json({
            error: false,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في تحديث حالة الإشعار'
        });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.id, req.user.type);

        res.json({
            error: false,
            message: 'تم تحديث جميع الإشعارات كمقروءة'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في تحديث حالة جميع الإشعارات'
        });
    }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
    try {
        await NotificationService.deleteNotification(
            req.params.notificationId,
            req.user.id
        );

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
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(
            req.user.id,
            req.user.type
        );

        res.json({
            error: false,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في جلب عدد الإشعارات غير المقروءة'
        });
    }
});

module.exports = router; 