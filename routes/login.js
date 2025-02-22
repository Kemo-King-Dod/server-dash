const express = require("express")
const route = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Store = require("../database/store")
const User = require("../database/users")
const Driver = require("../database/driver")
const Admin = require("../database/admin")

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
                    status: exist.status ? exist.status : null,
                    picture: userType == "Store" ? exist.Picture : null
                }
            }
        }

        console.log(response)
        res.status(200).json(response)

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            error: true,
            data: "حدث خطأ أثناء تسجيل الدخول"
        })
    }
})

module.exports = route