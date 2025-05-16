const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    type: {
        type: String,
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