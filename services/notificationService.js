const Notification = require('../database/notification');
const admin = require('firebase-admin'); // Assuming you have Firebase configured

class NotificationService {
    static async createNotification(recipientId, recipientType, title, body, type, data = {}) {
        try {
            const notification = new Notification({
                recipient: recipientId,
                recipientType,
                title,
                body,
                type,
                data
            });

            await notification.save();
            return notification;
        } catch (error) {
            console.error('خطأ في إنشاء الإشعار:', error);
            throw new Error('فشل في إنشاء الإشعار');
        }
    }

    static async getNotifications(userId, userType, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const notifications = await Notification.find({
                recipient: userId,
                recipientType: userType
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            const total = await Notification.countDocuments({
                recipient: userId,
                recipientType: userType
            });

            return {
                notifications,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasMore: skip + notifications.length < total
                }
            };
        } catch (error) {
            console.error('خطأ في جلب الإشعارات:', error);
            throw new Error('فشل في جلب الإشعارات');
        }
    }

    static async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, recipient: userId },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                throw new Error('الإشعار غير موجود');
            }

            return notification;
        } catch (error) {
            console.error('خطأ في تحديث حالة الإشعار:', error);
            throw new Error('فشل في تحديث حالة الإشعار');
        }
    }

    static async markAllAsRead(userId, userType) {
        try {
            const result = await Notification.updateMany(
                { recipient: userId, recipientType: userType },
                { isRead: true }
            );

            return result;
        } catch (error) {
            console.error('خطأ في تحديث حالة جميع الإشعارات:', error);
            throw new Error('فشل في تحديث حالة جميع الإشعارات');
        }
    }
}

module.exports = NotificationService; 