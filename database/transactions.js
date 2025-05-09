const mongoose = require('mongoose')
const Schema = mongoose.Schema

const transaction = new Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
   
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    }
})
const Transaction = mongoose.model('Transaction', transaction)
module.exports = Transaction