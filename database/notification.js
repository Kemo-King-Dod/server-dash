const mongoose = require('mongoose');

const notification = new mongoose.Schema({
    id: {
        type: String
    },
    userType: {
        type: String
    },
    title: {
        type: String
    },
    body: {
        type: String
    },
    type: {
        type: String,
        enum: ['success', 'info', 'promotion', 'warning']
    },
    isRead: {
        type: Boolean,
        require: true,
        default: false
    }
})

// Index for better query performance
notification.index({ id: 1 });

module.exports = mongoose.model('Notification', notification)

