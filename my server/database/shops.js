const mongoose = require('mongoose')
const Schema = mongoose.Schema

const shops = new Schema({
    name: {
        type: String,
        require: [true, 'الإسم مطلوب']
    },
    phone: {
        type: String,
        length: 10,
        require: [true, 'رقم الهاتف مطلوب']
    },
    password: {
        type: String,
        require: [true, 'كلمة السر مطلوبة']
    },
    storeType: {
        type: String,
        require: [true, 'النوع مطلوب']
    },
    userType:{
        type: String
    },
    date: {
        type: Date
    },
    opened:{
        type: Boolean
    },
    opentimeam:{
        type: Date
    },
    closetimeam:{
        type: Date
    },
    opentimepm:{
        type: Date
    },
    closetimepm:{
        type: Date
    },
    location: {
        type: Object
    },
    condition: {
        type: String
    },
    connection:{
        type: Boolean
    },
    connection_id: {
        type: String
    },
    items:{
        type: Array
    }
})

module.exports = mongoose.model('Shop', shops)