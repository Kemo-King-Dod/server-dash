const mongoose = require('mongoose')
const Schema = mongoose.Schema

const retrenchments = new Schema({
    items:{
        type: Array
    },
    store_id:{
        type: String
    },
    retrenchment_percent:{
        type: Number
    },
    retrenchment_start:{
        type: Date
    },
    retrenchment_end:{
        type: Date
    }
})


module.exports = mongoose.model('Retrenchment',retrenchments)