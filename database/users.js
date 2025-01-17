const mongoose = require('mongoose')
const Schema = mongoose.Schema

const users = new Schema({
    name: {
        type: String,
        require: [true, 'الإسم مطلوب']
    },
    password: {
        type: String,
        require: [true, 'كلمة السر مطلوبة']
    },
    phone: {
        type: String,
        length: 10,
        require: [true, 'رقم الهاتف مطلوب']
    },
    locations: {
        type: Array
    },
    register_condition: {
        type: String,
        require: [true, 'الموقع مطلوب'],
        default: "waiting"
    },
    orders:{
        type: Array
    },
    cart:{
        type: Array
    },
    connection:{
        type: Boolean,
        require: [true, 'الإتصال مطلوب'],
        default: false
    },
    connection_id: {
        type: String
    },
    money_record: {
        type: Array
    },
    notifications_condition:{
        type: Boolean,
        default:true
    },
    notifications:{
        type: Array
    },
    favorate_items:{
        type: Array
    },
    favorate_stors:{
        type: Array
    },
})

module.exports = mongoose.model('User', users)