const express = require("express")
const route = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Store = require("../database/store")
const User = require("../database/users")
const Driver = require("../database/driver")
const Admin = require("../database/admin")
const crypto = require('crypto');
// const nodemailer = require('nodemailer');
const Verification = require("../database/verifications")

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman"

const sign = function (id, type) {
    return jwt.sign({ id, type }, JWT_SECRET)
}

// Configure nodemailer (add your email service credentials)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'your-email@gmail.com',
//         pass: 'your-app-specific-password'
//     }
// });

route.post("/login", async (req, res) => {
    try {
        const { phone, password } = req.body

        // Find user across all collections
        let exist = await Admin.findOne({ phone })
        if (!exist) exist = await Store.findOne({ phone })
        if (!exist) exist = await User.findOne({ phone })
        if (!exist) exist = await Driver.findOne({ phone })

        if (!exist) {
            return res.status(400).json({
                error: true,
                data: "رقم الهاتف غير موجود"
            })
        }

        // Verify password
        const valid = await bcrypt.compare(password, exist.password)
        if (!valid) {
            return res.status(400).json({
                error: true,
                data: "كلمة المرور غير صحيحة"
            })
        }

        // Generate response based on user type
        const userType = exist.userType
        const storeType = exist.storeType
        const token = sign(exist._id, userType)

        const response = {
            error: false,
            data: {
                token,
                user: {
                    id: exist._id,
                    name: exist.name,
                    phone: exist.phone,
                    userType,
                    address: exist.address || '',
                    createdAt: exist.createdAt || 0,
                    picture: storeType ? exist.picture : null,
                    storeType: storeType,
                    status: exist.status ? exist.status : null,
                    cancelOrderLimit: exist.cancelOrderLimit || 0,
                    opentimeam: exist.opentimeam || '',
                    opentimepm: exist.opentimepm || '',
                    closetimeam: exist.closetimeam || '',
                    closetimepm: exist.closetimepm || '',
                }
            }
        }

        res.status(200).json(response)

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            error: true,
            data: "حدث خطأ أثناء تسجيل الدخول"
        })
    }
})

route.post("/isPhoneExist", async (req, res) => {
    try {
        const { phone } = req.body;
        console.log(phone)

        // Find user across all collections
        let user = await Admin.findOne({ phone });
        if (!user) user = await Store.findOne({ phone });
        if (!user) user = await User.findOne({ phone });
        if (!user) user = await Driver.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                error: true,
                isExist: false,
                data: "رقم الهاتف غير موجود"
            });
        }

        // // Generate a 6-digit verification code
        // const verificationCode = Math.floor(100000 + Math.random() * 900000);

        // // Store the code in the database
        // await Verification.create({
        //     phone,
        //     code: verificationCode,
        //     expiresAt: new Date(Date.now() + 600000) // 10 minutes from now
        // });

        // // In a real application, you would send this code via SMS
        // console.log(`Verification code for ${phone}: ${verificationCode}`);

        res.status(200).json({
            error: false,
            isExist: true,
            data: "رقم الهاتف موجود"
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: true,
            message: "رقم الهاتف غير موجود"
        });
    }
});

route.post("/verifyCode", async (req, res) => {
    try {
        const { phone, code } = req.body;

        const verification = await Verification.findOne({
            phone,
            code: parseInt(code)
        });

        if (!verification) {
            return res.status(400).json({
                error: true,
                data: "رمز التحقق غير صحيح"
            });
        }

        // Code is valid
        res.status(200).json({
            error: false,
            data: "تم التحقق من الرمز بنجاح"
        });

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            error: true,
            data: "حدث خطأ في التحقق من الرمز"
        });
    }
});

route.post("/resetPassword", async (req, res) => {
    try {
        const { phone, code, newPassword } = req.body;

        // Verify the code
        const verification = await Verification.findOne({
            phone,
            code: parseInt(code)
        });

        if (!verification) {
            return res.status(400).json({
                error: true,
                data: "رمز التحقق غير صالح"
            });
        }

        // Find user across all collections
        let user = await Admin.findOne({ phone });
        if (!user) user = await Store.findOne({ phone });
        if (!user) user = await User.findOne({ phone });
        if (!user) user = await Driver.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                error: true,
                data: "رقم الهاتف غير موجود"
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password based on user type
        if (user.userType === 'admin') {
            await Admin.findByIdAndUpdate(user._id, { password: hashedPassword });
        } else if (user.userType === 'store') {
            await Store.findByIdAndUpdate(user._id, { password: hashedPassword });
        } else if (user.userType === 'user') {
            await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        } else if (user.userType === 'driver') {
            await Driver.findByIdAndUpdate(user._id, { password: hashedPassword });
        }

        // Delete the verification code
        await Verification.deleteOne({ _id: verification._id });

        res.status(200).json({
            error: false,
            data: "تم تغيير كلمة المرور بنجاح"
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: true,
            data: "حدث خطأ في تغيير كلمة المرور"
        });
    }
});

module.exports = route