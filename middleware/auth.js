const jwt = require('jsonwebtoken');
const  User  = require('../database/users');
const  Driver = require('../database/driver');
const  Store = require('../database/store');
const  Admin = require('../database/admin');




// JWT secret key
const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const auth = async (req, res, next) => {
    try {
        console.log("start")

        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                error: true,
                message: 'يرجى تسجيل الدخول'
            });
        }

        const decoded = await jwt.verify(token, JWT_SECRET)
        req.userId = decoded.id;
        console.log("0")

        let exist = 
          await User.findOne({ _id: req.userId });
        if (!exist) exist = await Driver.findOne({  _id: req.userId})
         if (!exist) exist = await Store.findOne({  _id: req.userId})
      
        // Find user across all collections
        if (!exist)   await Admin.findOne({  _id: req.userId})
        console.log("exist",exist)


        exist.fcmToken = req.headers['fcm_token']
        exist.save()

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({
            error: true,
            message: 'يرجى الدخول'
        });
    }
};

module.exports = { auth };