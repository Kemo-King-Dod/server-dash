const mongoose = require('mongoose')
const Schema = mongoose.Schema

const info = new Schema({
    drivers_number: {
        type: Number
    },
    customers_number: {
        type: Number
    },
    stores_number: {
        type: Number
    },
    transactions_number: {
        type: Number
    },
    notifications_number: {
        type: Number
    },
    ads_number: {
        type: Number
    },
    items_number: {
        type: Number
    },
    withdrawals_number: {
        type: Number
    },
    orders_number:{
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('Info', info)