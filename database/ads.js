const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ads = new Schema({
    name: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    price:{
        type:Number,
        required:true,
        default:0,
    },
})
const Ads = mongoose.model('Ads', ads)
module.exports = Ads