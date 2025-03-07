const mongoose = require('mongoose')
const Schema = mongoose.Schema

const users = new Schema({
    name: {
        type: String,
        require: [true, 'الإسم مطلوب']
    },
    phone: {
        type: Number,
        length: 10,
        require: [true, 'رقم الهاتف مطلوب']
    },
    password: {
        type: String,
        require: [true, 'كلمة السر مطلوبة']
    },
    cart: {
        type: Array
    },
    orders: {
        type: Array
    },
    favorite: {
        type: Array
    },
    userType:{
        type: String
    },
    location: {
        type: Array
    },
    connection:{
        type: Boolean
    },
    connection_id: {
        type: String
    }
})

module.exports = mongoose.model('User', users)