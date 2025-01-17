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
    delivery_cost_by_kilo: {
        type: String,
        require: [true, 'السعر مطلوب'],
        length: 2
    },
    license_number: {
        type: String,
        require: [true, 'رقم الرخصة مطلوب']
    },
    license_picture: {
        type: String,
        require: [true, 'صورة الرخصة مطلوبة']
    },
    location: {
        type: Object,
        require: [true, 'الموقع مطلوب']
    },
    address: {
        type: String,
        require: [true, 'العنوان مطلوب']
    },
    store_picture: {
        type: String,
        require: [true, 'صورة المتجر مطلوبة']
    },
    register_condition: {
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
    connection_id: {
        type: String,
        default: false
    },
    orders: {
        type: Array
    },
    Retrenchments_numbers: {
        type: Array
    },
    total_commission: {
        type: Number
    },
    money_record: {
        type: Array
    },
    discription: {
        type: String
    },
    notifications_condition: {
        type: Boolean,
        default: true
    },
    open_condition: {
        type: Boolean,
        default: false
    },
    register_history: {
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
    }
})

module.exports = mongoose.model('Store', stores)