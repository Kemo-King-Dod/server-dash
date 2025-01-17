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
    registerCondition: {
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
    connectionId: {
        type: String
    },
    moneyRecord: {
        type: Array
    },
    notificationsCondition:{
        type: Boolean,
        default:true
    },
    notifications:{
        type: Array
    },
    favorateItems:{
        type: Array
    },
    favorateStors:{
        type: Array
    },
    userType: {
        type: String
    },
    fcmToken:{
        type: String
    }
})

module.exports = mongoose.model('User', users)