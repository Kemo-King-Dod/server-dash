const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');

// User Signup
router.post('/user', async (req, res) => {
    try {
        const { name, password, phone, locations , fcmToken} = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({
                error: true,
                message: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            password: hashedPassword,
            phone,
            locations: locations || [],
            register_condition: "waiting",
            orders: [],
            cart: [],
            connection: false,
            money_record: [],
            notifications: [],
            favorate_items: [],
            favorate_stors: [],
            userType: "Customer",
            fcmToken: fcmToken
        });

        await newUser.save();

        res.status(201).json({
            error: false,
            message: 'تم التسجيل بنجاح',
            user: {
                id: newUser._id,
                name: newUser.name,
                phone: newUser.phone
            }
        });

    } catch (error) {
        console.error('User signup error:', error);
        res.status(500).json({
            error: true,
            message: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Driver Signup
router.post('/driver', async (req, res) => {
    try {
        const { 
            name, 
            password, 
            phone,
            license_number,
            license_picture,
            viacle_type  // Note: there's a typo in schema 'viacle' vs 'vehicle'
        } = req.body;

        // Check if driver already exists
        const existingDriver = await Driver.findOne({ phone });
        if (existingDriver) {
            return res.status(400).json({
                error: true,
                message: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new driver
        const newDriver = new Driver({
            name,
            password: hashedPassword,
            phone,
            license_number,
            license_picture,
            viacle_type,
            register_condition: "waiting",
            connection: false,
            total_commission: 0,
            money_record: [],
            notifications_condition: true,
            notifications: [],
            orders: [],
            join_date: new Date(),
            activity_condition: true,
            is_there_order: false,
            current_order: {},
            funds: 0,
            userType: "Driver",
            fcmToken: fcmToken
        });

        await newDriver.save();

        res.status(201).json({
            error: false,
            message: 'تم التسجيل بنجاح',
            driver: {
                id: newDriver._id,
                name: newDriver.name,
                phone: newDriver.phone
            }
        });

    } catch (error) {
        console.error('Driver signup error:', error);
        res.status(500).json({
            error: true,
            message: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Store Signup
router.post('/store', async (req, res) => {
    try {
        const { 
            name, 
            password, 
            phone,
            storeType,
            delivery_cost_by_kilo,
            license_number,
            license_picture,
            location,
            address,
            store_picture,
            discription
        } = req.body;

        // Check if store already exists
        const existingStore = await Store.findOne({ phone });
        if (existingStore) {
            return res.status(400).json({
                error: true,
                message: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new store
        const newStore = new Store({
            name,
            password: hashedPassword,
            phone,
            storeType,
            delivery_cost_by_kilo,
            license_number,
            license_picture,
            location,
            address,
            store_picture,
            discription,
            register_condition: "waiting",
            items: [],
            connection: false,
            connection_id: false,
            orders: [],
            Retrenchments_numbers: [],
            total_commission: 0,
            money_record: [],
            notifications_condition: true,
            open_condition: false,
            register_history: new Date(),
            notifications: [],
            funds: 0,
            userType: "Store",
            fcmToken: fcmToken
        });

        await newStore.save();

        res.status(201).json({
            error: false,
            message: 'تم التسجيل بنجاح',
            store: {
                id: newStore._id,
                name: newStore.name,
                phone: newStore.phone
            }
        });

    } catch (error) {
        console.error('Store signup error:', error);
        res.status(500).json({
            error: true,
            message: 'حدث خطأ أثناء التسجيل'
        });
    }
});

module.exports = router;