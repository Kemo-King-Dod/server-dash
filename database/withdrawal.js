const mongoose = require('mongoose')
const Schema = mongoose.Schema

const withdrawal = new Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'finished', 'onWay'],
        default: 'waiting'
    },
    balance: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    storeId: {
        type: String,
        required: true
    }
})

const Withdrawal = mongoose.model('Withdrawal', withdrawal);
module.exports = Withdrawal;