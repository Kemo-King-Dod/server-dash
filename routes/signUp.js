const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const sign = function (id, type) {
    return jwt.sign({ id, type }, JWT_SECRET);
};

// User Signup
router.post('/user', async (req, res) => {
    try {
        const { name, password, phone, locations, fcmToken } = req.body;

        if (!name || !password || !phone) {
            return res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({
                error: true,
                data: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            password: hashedPassword,
            phone,
            locations: locations || [],
            registerCondition: "active",
            orders: [],
            cart: [],
            connection: false,
            connectionId: null,
            moneyRecord: [],
            notifications: [],
            favorateItems: [],
            favorateStors: [],
            userType: "Customer",
            fcmToken
        });

        await newUser.save();
        const token = sign(newUser._id, "Customer");

        return res.status(201).json({
            error: false,
            data: {
                token,
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    phone: newUser.phone,
                    userType: "Customer",
                    registerCondition: newUser.registerCondition
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Driver Signup
router.post('/driver', async (req, res) => {
    try {
        const { name, password, phone, licenseNumber, licensePicture, viacleType, fcmToken } = req.body;

        if (!name || !password || !phone || !licenseNumber || !licensePicture || !viacleType) {
            return res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
        }

        const existingDriver = await Driver.findOne({ phone });
        if (existingDriver) {
            return res.status(400).json({
                error: true,
                data: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDriver = new Driver({
            name,
            password: hashedPassword,
            phone,
            licenseNumber,
            licensePicture,
            viacleType,
            registerCondition: "waiting",
            connection: false,
            connectionId: null,
            totalCommission: 0,
            moneyRecord: [],
            notificationsCondition: true,
            notifications: [],
            orders: [],
            joinDate: new Date(),
            activityCondition: true,
            isThereOrder: false,
            currentOrder: {},
            funds: 0,
            userType: "Driver",
            fcmToken
        });

        await newDriver.save();
        const token = sign(newDriver._id, "Driver");

        return res.status(201).json({
            error: false,
            data: {
                token,
                user: {
                    id: newDriver._id,
                    name: newDriver.name,
                    phone: newDriver.phone,
                    userType: "Driver",
                    registerCondition: newDriver.registerCondition
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Store Signup
router.post('/store', async (req, res) => {
    try {
        console.log(req.body)
        const { name, password, phone, storeType, idNumber, licenseNumber, ownerName, city, location, address, picture, fcmToken } = req.body;

        if (!name || !password || !phone || !storeType || !idNumber || !ownerName || !city || !licenseNumber || !location || !address || !picture) {
        console.log(1)
        console.log(1)
            return res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
        }

        const existingStore = await Store.findOne({ phone });
        if (existingStore) {
        console.log(2)
            return res.status(400).json({
                error: true,
                data: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStore = new Store({
            name,
            password: hashedPassword,
            phone,
            storeType,
            idNumber,
            licenseNumber,
            ownerName,
            city,
            location,
            address,
            picture,
            description: '',
            registerCondition: "waiting",
            items: [],
            connection: false,
            connectionId: null,
            orders: [],
            RetrenchmentsNumbers: [],
            totalCommission: 0,
            moneyRecord: [],
            notificationsCondition: true,
            openCondition: false,
            registerHistory: new Date(),
            notifications: [],
            funds: 0,
            userType: "Store",
            fcmToken
        });

        await newStore.save();
        const token = sign(newStore._id, "Store");

        console.log(5)
        return res.status(201).json({
        error: false,
            data: {
                token,
                user: {
                    id: newStore._id,
                    name: newStore.name,
                    phone: newStore.phone,
                    userType: "Store",
                    registerCondition: newStore.registerCondition,
                    picture: newStore.picture
                }
            }
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

module.exports = router;