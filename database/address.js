const mongoose = require('mongoose')
const Schema = mongoose.Schema

const address = new Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude:{
        type: Number
    }
})
const Address=mongoose.model('Address', address);
module.exports = Address;