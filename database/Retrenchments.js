const mongoose = require('mongoose')
const Schema = mongoose.Schema

const retrenchments = new Schema({
    name: {
        type: String
    },
    items: {
        type: Array
    },
    store_id: {
        type: String
    },
    retrenchment_percent: {
        type: Number
    },
    retrenchment_start: {
        type: String
    },
    retrenchment_end: {
        type: String
    }
})

const Retrenchments = mongoose.model('Retrenchment', retrenchments)
module.exports = Retrenchments;