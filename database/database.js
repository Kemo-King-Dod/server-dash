const mongoose = require('mongoose')

const connecting = async () => {
    try{
        await mongoose.connect("mongodb+srv://murafiq00:123456%402025@murafiq.lmuoyzo.mongodb.net/fasto?retryWrites=true&w=majority&appName=Murafiq");
        console.log('connection succuss')
    }catch(err){
        console.log(err)
    }
}

module.exports = connecting

// mongodb+srv://abdelrhamn98:0922224420@cluster0.7dk3i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0