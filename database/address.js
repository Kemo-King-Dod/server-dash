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

module.exports = mongoose.model('Address', address)