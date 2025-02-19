const mongoose = require('mongoose')

const connecting = async () => {
    try{
        await mongoose.connect('mongodb://0.0.0.0/store')
        console.log('connection succuss')
    }catch(err){
        console.log(err)
    }
}

module.exports = connecting

// mongodb+srv://abdelrhamn98:0922224420@cluster0.7dk3i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0