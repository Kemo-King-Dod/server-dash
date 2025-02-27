const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationSchema = new Schema({
    phone: {
        type: String,
        required: true
    },
    code: {
        type: Number,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' } // Document will be automatically deleted after 10 minutes
    }
});

module.exports = mongoose.model('Verification', verificationSchema);
