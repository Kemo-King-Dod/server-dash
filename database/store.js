const mongoose = require('mongoose')
const Schema = mongoose.Schema

const stores = new Schema({
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
    deliveryCostByKilo: {
        type: String,
        require: [true, 'السعر مطلوب'],
        default: 10,
        length: 2
    },
    idNumber: {
        type: String,
        require: [true, 'رقم الهوية مطلوب']
    },
    licenseNumber: {
        type: String,
        require: [true, 'رقم الرخصة مطلوب']
    },
    location: {
        type: Object,
        require: [true, 'الموقع مطلوب']
    },
    address: {
        type: String,
        require: [true, 'العنوان مطلوب']
    },
    onerName:{
        type: String
    },
    Picture: {
        type: String,
        require: [true, 'صورة المتجر مطلوبة']
    },
    registerCondition: {
        type: String,
        default: "waiting"
    },
    items: {
        type: Array
    },
    connection: {
        type: Boolean,
        default: false
    },
    connectionId: {
        type: String,
        default: false
    },
    orders: {
        type: Array
    },
    RetrenchmentsNumbers: {
        type: Array
    },
    totalCommission: {
        type: Number
    },
    moneyRecord: {
        type: Array
    },
    discription: {
        type: String
    },
    notificationsCondition: {
        type: Boolean,
        default: true
    },
    openCondition: {
        type: Boolean,
        default: false
    },
    registerHistory: {
        type: Date
    },
    opentimeam: {
        type: Date,
        default: null
    },
    closetimeam: {
        type: Date,
        default: null
    },
    opentimepm: {
        type: Date,
        default: null
    },
    closetimepm: {
        type: Date,
        default: null
    },
    notifications: {
        type: Array,
        default: null
    },
    // رصيد
    funds: {
        type: Number,
        default: null
    },
    userType: {
        type: String
    },
    fcmToken:{
        type: String
    }
})

module.exports = mongoose.model('Store', stores)