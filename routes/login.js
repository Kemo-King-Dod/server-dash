const express = require("express")
const route = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Store = require("../database/store")
const User = require("../database/users")
const Driver = require("../database/driver")
const Admin = require("../database/admin")
const axios = require('axios')
const router = require("./controlPanel")

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman"

const sign = function (id, type) {
    return jwt.sign({ id, type }, JWT_SECRET)
}

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

        // Find user across all collections
        let user = await Admin.findOne({ phone });
        if (!user) user = await Store.findOne({ phone });
        if (!user) user = await User.findOne({ phone });
        if (!user) user = await Driver.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                error: false,
                isExist: false,
                data: "رقم الهاتف غير موجود"
            });
        }


        const authResponse = await axios.post(
            "http://otp.sadeem-factory.com/api/v1/login",
            {
                email: "khaliljaber2002@gmail.com",
                password: "ANssIS@@*Kk",
            },
            { headers: { "Content-Type": "application/json" } }
        );

        if (authResponse.status !== 200 || !authResponse.data.token) {
            return res.status(403).json({
                error: true,
                message: "فشل في الحصول على التوكن"
            })
        }

        const token = authResponse.data.token.value;

        // إرسال OTP
        const otpResponse = await axios.post(
            "https://otp.sadeem-factory.com/api/v1/pins?service_name=fasto&test=true",
            { phone },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })
        user.otp = otpResponse.data.pin
        await user.save()

        res.status(200).json({
            error: false,
            isExist: true,
            massege: 'قم بإدخال رمز التحقق عند الوصول'
        })


    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: true,
            message: "رقم الهاتف غير موجود"
        });
    }
});

router.post('/checkOtp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // Find user across all collections
        let user = await Admin.findOne({ phone });
        if (!user) user = await Store.findOne({ phone });
        if (!user) user = await User.findOne({ phone });
        if (!user) user = await Driver.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                error: false,
                isExist: false,
                data: "رقم الهاتف غير موجود"
            });
        }

        if (user.otp != otp) {
            return res.status(403).json({
                error: false,
                data: "رقم التحقق غير صحيح"
            })
        }
        else {
            const token = sign(user._id, user.userType)

            res.status(201).json({
                error: false,
                data: {
                    token
                }
            })
            user.otp = ''
            await user.save()
        }


    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: true,
            message: "رقم الهاتف غير موجود"
        });
    }
})


router.post('/newPassword', async (req, res) => {
    try {
        const { phone, newPassword, token } = req.body;
        console.log(req.body)

        // Find user across all collections
        let user = await Admin.findOne({ phone });
        if (!user) user = await Store.findOne({ phone });
        if (!user) user = await User.findOne({ phone });
        if (!user) user = await Driver.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                error: false,
                isExist: false,
                data: "رقم الهاتف غير موجود"
            });
        }

        const decoded = await jwt.verify(token, JWT_SECRET)

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(newPassword, salt)
        await user.save()

        res.status(200).json({
            error: false,
            ischange: true,
            massege: 'تم تغيير كلمة المرور'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})


module.exports = route