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
    licenseNumber:{
        type: String,
        require: [true, 'رقم الرخصة مطلوب']
    },
    licensePicture:{
        type: String,
        require: [true, 'صورة الرخصة مطلوبة']
    },
    registerCondition: {
        type: String,
        require: [true, 'الموقع مطلوب'],
        default: "waiting"
    },
    connection:{
        type: Boolean,
        require: [true, 'الإتصال مطلوب'],
        default: false
    },
    connectionId: {
        type: String
    },
    totalCommission: {
        type: Number
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
    orders:{
        type: Array
    },
    viacleType:{
        type: String
    },
    joinDate:{
        type: Date
    },
    activityCondition:{
        type:Boolean,
        default: true
    },
    isThereOrder:{
        type: Boolean
    },
    currentOrder: {
        type: Object
    },
    funds:{
        type: Number
    },
    userType: {
        type: String
    },
    fcmToken:{
        type: String
    }
})

module.exports = mongoose.model('Driver', drivers)