const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const fs = require('fs');

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const sign = function (id, type) {
    return jwt.sign({ id, type }, JWT_SECRET);
};

const deleteUploadedFile = async (filePath) => {
    try {
        if (!filePath) return;
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

// User Signup
router.post('/user', async (req, res) => {
    try {
        const { name, password, phone, locations, fcmToken } = req.body;

        if (!name || !password || !phone) {
            res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            res.status(400).json({
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
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Driver Signup
router.post('/driver', async (req, res) => {
    try {
        const { name, phone, password, age, gender, viacleType, licenseNumber, licenseImage, passportImage, CarBookImage, CarImage } = req.body;

        if (!name || !phone || !password || !age || !gender || !viacleType || !licenseNumber || !licenseImage || !passportImage || !CarBookImage || !CarImage) {
            await deleteUploadedFile(licenseNumber);
            await deleteUploadedFile(licenseImage);
            await deleteUploadedFile(passportImage);
            await deleteUploadedFile(CarImage);
            res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
            return
        }

        const existingDriver = await Driver.findOne({ phone });
        if (existingDriver) {
            await deleteUploadedFile(licenseNumber);
            await deleteUploadedFile(licenseImage);
            await deleteUploadedFile(passportImage);
            await deleteUploadedFile(CarImage);
            res.status(400).json({
                error: true,
                data: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDriver = new Driver({
            name,
            phone,
            password: hashedPassword,
            age,
            gender,
            viacleType,
            licenseNumber,
            licenseImage,
            passportImage,
            CarBookImage,
            CarImage,
            connection: false,
            connectionId: null,
            moneyRecord: [],
            orders: [],
            joinDate: new Date(),
            currentOrder: {},
            funds: 0,
            userType: "Driver",
            fcmToken: "kamal"
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
    } catch (error) {
        await deleteUploadedFile(req.body.licenseNumber);
        await deleteUploadedFile(req.body.licenseImage);
        await deleteUploadedFile(req.body.passportImage);
        await deleteUploadedFile(req.body.CarImage);
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        });
    }
});

// Store Signup
router.post('/store', async (req, res) => {
    try {
        const { name, password, phone, storeType, idNumber, licenseNumber, ownerName, city, location, address, picture, fcmToken } = req.body;

        if (!name || !password || !phone || !storeType || !idNumber || !ownerName || !city || !licenseNumber || !location || !address || !picture || picture == null) {
            await deleteUploadedFile(picture);
            res.status(400).json({
                error: true,
                data: 'جميع الحقول مطلوبة'
            });
            return;
        }

        const existingStore = await Store.findOne({ phone });
        if (existingStore) {
            await deleteUploadedFile(picture);
            res.status(400).json({
                error: true,
                data: 'رقم الهاتف مسجل مسبقاً'
            });
            return;
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
    } catch (error) {
        await deleteUploadedFile(req.body.picture);
        console.log(error.message)
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

module.exports = router;