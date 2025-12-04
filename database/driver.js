const mongoose = require('mongoose')
const Schema = mongoose.Schema

const drivers = new Schema({
    name: {
        type: String,
        require: [true, 'الإسم مطلوب']
    },
    age: {
        type: String,
        require: [true, 'العمر مطلوب']
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
    gender: {
        type: String,
        require: [true, 'الجنس مطلوب']
    },
    licenseNumber: {
        type: String
    },
    carCardNumber: {
        type: String
    },
    licenseImage: {
        type: String,
        require: [true, 'صورة الرخصة مطلوبة']
    },
    CarBookImage: {
        type: String,
        require: [true, 'صورة كتيب مطلوبة']
    },
    CarImage: {
        type: String,
        require: [true, 'صورة السيارة مطلوبة']
    },
    passportImage: {
        type: String,
        require: [true, 'صورة الجواز مطلوبة']
    },
    status: {
        type: String,
        default: "waiting"
    },
    balance: {
        type: Number,
        default: 0
    },
    connection: {
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
    orders: {
        type: Array
    },
    vehicleType: {
        type: String,
        default: null
    },
    joinDate: {
        type: Date
    },
    currentOrder: {
        type: Object
    },
    // اللي نبوه من السائق
    funds: {
        type: Number
    },
    userType: {
        type: String
    },
    fcmToken: {
        type: String
    },
    cancelOrderLimit: {
        type: Number,
        default: 0
    },
    otp: {
        type: String
    },
    city: {
        type: String
    },
    blockUntil:{
        type : Date ,
    },
    timesForgetPassword:{
        type: Number,
        default:0,
    },
    lastWithdrawal: {
        type: Date,
        default: null
    },
    rating: {
      type: Number,
      default: 0
    },
    ratingUsers:{
      type:Number,
      default: 0
    },
    rate:{
      type:Number,
      default:0
    }
})
const Driver = mongoose.model('Driver', drivers);
module.exports =Driver;