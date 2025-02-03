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
        type: String
    },
    longitude:{
        type: String
    }
})

module.exports = mongoose.model('Addresse', addresse)