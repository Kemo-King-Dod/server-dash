const jwt = require('jsonwebtoken');
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');

// JWT secret key
const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const auth = async (req, res, next) => {
    try {
        // Get the requested user type from the route parameter or query
        const requiredType = req.params.type || req.query.type;
        if (!requiredType) {
            return res.status(400).json({
                success: false,
                message: 'نوع المستخدم مطلوب'
            });
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'يرجى تسجيل الدخول'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if the token type matches the required type
        if (decoded.type !== requiredType) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بالوصول'
            });
        }

        let user;
        
        // Find user based on type
        switch (decoded.type) {
            case 'user':
                user = await User.findOne({ _id: decoded._id });
                break;
            case 'driver':
                user = await Driver.findOne({ _id: decoded._id });
                break;
            case 'store':
                user = await Store.findOne({ _id: decoded._id });
                break;
            default:
                throw new Error('نوع المستخدم غير صالح');
        }

        if (!user) {
            throw new Error('المستخدم غير موجود');
        }

        // Add user and type to request object
        req.user = user;
        req.type = decoded.type;
        req.token = token;

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'يرجى تسجيل الدخول مجدداً'
        });
    }
};

module.exports = auth;