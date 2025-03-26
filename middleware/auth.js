const jwt = require('jsonwebtoken');

// JWT secret key
const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                error: true,
                message: 'يرجى تسجيل الدخول'
            });
        }

        const decoded = await jwt.verify(token, JWT_SECRET)
        req.userId = decoded.id;
        // Find user across all collections
        let exist = await Admin.findOne({ phone })
        console.log("1")
        if (!exist) exist = await Store.findOne({ phone })
        console.log("2")

        if (!exist) exist = await User.findOne({ phone })
        console.log("3")

        if (!exist) exist = await Driver.findOne({ phone })
            console.log("4")
        exist.fcmToken = req.headers['fcm_token']
        exist.save()

        next();
    } catch (error) {
        res.status(401).json({
            error: true,
            message: 'يرجى الدخول'
        });
    }
};

module.exports = { auth };