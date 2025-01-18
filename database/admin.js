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
    userType: {
        type: String
    },
    fcmToken:{
        type: String
    }
})

module.exports = mongoose.model('User', users)