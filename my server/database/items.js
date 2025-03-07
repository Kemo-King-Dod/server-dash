const mongoose = require('mongoose')
const Schema = mongoose.Schema

const items = new Schema({
    name:{
        type:String
    },
    price:{
        type:Number
    },
    desc:{
        type:String
    },
    options:{
        type:String
    },
    pictures:{
        type: Array
    },
    num:{
        type: Number
    },
    shopid:{
        type: Schema.Types.ObjectId
    },
    shop:{
        type: String
    }
})


module.exports = mongoose.model('Item',items)