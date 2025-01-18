const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        required: true,
        enum: ['User', 'Driver', 'Store']
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['ORDER', 'SYSTEM', 'PROMOTION', 'DELIVERY', 'PAYMENT']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
