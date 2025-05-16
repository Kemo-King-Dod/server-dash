const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    reportedabout: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: ['قيد المراجعة', 'تم المعالجة', 'مغلق'],
        default: 'قيد المراجعة',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;