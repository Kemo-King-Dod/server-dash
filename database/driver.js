const mongoose = require('mongoose')
const Schema = mongoose.Schema

const drivers = new Schema({
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
    license_number:{
        type: String,
        require: [true, 'رقم الرخصة مطلوب']
    },
    license_picture:{
        type: String,
        require: [true, 'صورة الرخصة مطلوبة']
    },
    register_condition: {
        type: String,
        require: [true, 'الموقع مطلوب'],
        default: "waiting"
    },
    connection:{
        type: Boolean,
        require: [true, 'الإتصال مطلوب'],
        default: false
    },
    connection_id: {
        type: String
    },
    total_commission: {
        type: Number
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
    orders:{
        type: Array
    },
    viacle_type:{
        type: String
    },
    join_date:{
        type: Date
    },
    activity_condition:{
        type:Boolean,
        default: true
    },
    is_there_order:{
        type: Boolean
    },
    current_order: {
        type: Object
    },
    funds:{
        type: Number
    },
    userType: {
        type: String
    }
})

module.exports = mongoose.model('Driver', drivers)