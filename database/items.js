const mongoose = require('mongoose')
const Schema = mongoose.Schema

const items = new Schema({
    name: {
        type: String
    },
    category: {
        type: String
    },
    imageUrl:{
        type: String
    },
    storeID: {
        type: Schema.Types.ObjectId
    },
    store_register_condition: {
        type: String
    },
    description: {
        type: String
    },
    price: {
        type: Number
    },
    options: {
        type: Array
    },
    addOns: {
        type: Array
    },
    stock: {
        type: Number
    },
    is_retrenchment: {
        type: Boolean
    },
    retrenchment_percent: {
        type: Number
    }
})


module.exports = mongoose.model('Item', items)