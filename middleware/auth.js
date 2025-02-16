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

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(token)
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({
            error: true,
            message: 'يرجى الدخول'
        });
    }
};

module.exports = {auth};