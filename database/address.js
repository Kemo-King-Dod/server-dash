const mongoose = require('mongoose')
const Schema = mongoose.Schema

const addresse = new Schema({
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

module.exports = mongoose.model('Addresse', addresse)