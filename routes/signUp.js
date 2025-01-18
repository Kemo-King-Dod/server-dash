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
    const { name, password, phone, locations, fcmToken } = req.body;

    if (!name || !password || !phone) {
        res.status(400).json({
            error: false,
            data: 'جميع الحقول مطلوبة'
        })
        res.end()
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
        res.status(400).json({
            error: false,
            data: 'رقم الهاتف مسجل مسبقاً'
        })
        res.end()
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        name,
        password: hashedPassword,
        phone,
        locations: locations || [],
        registerCondition: "waiting",
        orders: [],
        cart: [],
        connection: false,
        moneyRecord: [],
        notifications: [],
        favorateItems: [],
        favorateStors: [],
        userType: "Customer",
        fcmToken
    });

    await newUser.save();

    const token = sign(newUser._id, "Customer");

    res.status(201).json({
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
});

// Driver Signup
router.post('/driver', async (req, res) => {
    const {
        name,
        password,
        phone,
        licenseNumber,
        licensePicture,
        viacleType,
        fcmToken
    } = req.body;

    if (!name || !password || !phone || !licenseNumber || !licensePicture || !viacleType) {
        res.status(400).json({
            error: false,
            data: 'جميع الحقول مطلوبة'
        })
        res.end()
    }

    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
        res.status(400).json({
            error: false,
            data: 'رقم الهاتف مسجل مسبقاً'
        })
        res.end()
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

    res.status(201).json({
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
});

// Store Signup
router.post('/store', async (req, res) => {
    const {
        name,
        password,
        phone,
        storeType,
        idNumber,
        licenseNumber,
        ownerName,
        city,
        location,
        address,
        picture,
        fcmToken
    } = req.body;

    if (!name || !password || !phone || !storeType || !idNumber || !ownerName || !city || !licenseNumber || !location || !address || !picture) {
        res.status(400).json({
            error: false,
            data: 'جميع الحقول مطلوبة'
        })
        res.end()
    }

    const existingStore = await Store.findOne({ phone });
    if (existingStore) {
        res.status(400).json({
            error: false,
            data: 'رقم الهاتف مسجل مسبقاً'
        })
        res.end()
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStore = new Store({
        name,
        password: hashedPassword,
        phone,
        storeType,
        deliveryCostByKilo,
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
        connectionId: false,
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

    res.status(201).json({
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
});

module.exports = router;