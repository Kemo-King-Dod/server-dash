const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../database/users');
const Driver = require('../database/driver');
const Store = require('../database/store');
const Order = require('../database/orders')
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const getCityName = require("../utils/getCityName")

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const sign = function (id, type) {
    return jwt.sign({ id, type }, JWT_SECRET);
};

const deleteUploadedFile = async (filePath) => {
    try {
        if (!filePath) return;
        if (fs.existsSync(path.join(__dirname, '..', filePath)))
            await fs.unlink(path.join(__dirname, '..', filePath));
    } catch (error) {
        // console.error('Error deleting file:', error);
    }
};

// User Signup
router.post('/user', async (req, res) => {
    try {
        const { name, password,/*  gender,  */phone, locations, fcmToken } = req.body;
         
        if (!name || !password || !phone/*  || !gender */) {
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
        } else {


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
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء التسجيل'
        });
    }
});

// Driver Signup
router.post('/driver', async (req, res) => {
  try {
    console.log(req.body)
    const { driver, password } = req.body;
    const { name, phone, age, gender, vehicleType, licenseNumber, licenseImage, passportImage, carBookImage, carImage } = driver || {};

    const cleanup = async () => {
      await deleteUploadedFile(licenseImage);
      await deleteUploadedFile(passportImage);
      await deleteUploadedFile(carBookImage);
      await deleteUploadedFile(carImage);
    };

    if (!name || !phone || !password || !age || !gender || !vehicleType || !licenseNumber || !licenseImage || !passportImage || !carBookImage || !carImage) {
      await cleanup();
      return res.status(400).json({ error: true, message: 'جميع الحقول مطلوبة' });
    }

    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      await cleanup();
      return res.status(400).json({ error: true, message: 'رقم الهاتف مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = new Driver({
      ...driver,
      password: hashedPassword,
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
    console.error(error);
    await deleteUploadedFile(req.body.driver?.licenseImage);
    await deleteUploadedFile(req.body.driver?.passportImage);
    await deleteUploadedFile(req.body.driver?.carBookImage);
    await deleteUploadedFile(req.body.driver?.carImage);
    res.status(500).json({ error: true, message: error.message || error });
  }
});

// Store Signup
router.post('/store', async (req, res) => {
    try {
        const { name, password, phone, storeType, idNumber, licenseNumber, ownerName, location, address, picture, fcmToken,closetimeam,closetimepm,opentimeam,opentimepm } = req.body;
        const city = getCityName(location).englishName;
        console.log("req.body",req.body,"city",city);
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
            idNumber:"000000",
            licenseNumber:"000000",
            ownerName,
            city:getCityName(location).englishName,
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
            fcmToken,
            opentimeam,
            opentimepm,
            closetimeam,
            closetimepm,

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
                    picture: newStore.picture,
                    createdAt:newStore.createdAt,
                    address:address,
                    storeType:storeType,
                    opentimeam:opentimeam,
                    opentimepm:opentimepm,
                    closetimeam:closetimeam,
                    closetimepm:closetimepm,



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

// Delete User Account
router.delete('/user', auth, async (req, res) => {
    try {
        const { userId } = req.userId;

        // Find the user
        const user = await User.findById(userId)

        // Find and cancel all active orders for this user
        const activeOrders = await Order.find({
            userId: userId,
            status: { $nin: ['confiremd', 'cancelled'] }
        });

        // Update each order status to cancelled
        for (const order of activeOrders) {
            order.status = 'cancelled';
            order.cancellationReason = 'تم حذف حساب المستخدم';
            await order.save();
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            error: false,
            data: 'تم حذف الحساب بنجاح وإلغاء جميع الطلبات النشطة'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء حذف الحساب'
        });
    }
});

// Delete Driver Account
router.delete('/driver', async (req, res) => {
    try {
        const { driverId } = req.userId;

        // Find the driver
        const driver = await Driver.findById(driverId);

        // Find and reassign any active orders for this driver
        const activeOrders = await Order.find({
            driverId: driverId,
            status: { $nin: ['confiremd', 'cancelled'] }
        });

        if (activeOrders.length > 0) {
            return res.status(401).json({
                error: true,
                data: 'لا يمكن حذف حساب السائق لوجود طلبات نشطة'
            });
        }

        // Delete driver's uploaded files
        await deleteUploadedFile(driver.licenseImage);
        await deleteUploadedFile(driver.passportImage);
        await deleteUploadedFile(driver.carBookImage);
        await deleteUploadedFile(driver.carImage);

        // Delete the driver
        await Driver.findByIdAndDelete(driverId);

        res.status(200).json({
            error: false,
            data: 'تم حذف حساب السائق بنجاح وإعادة تعيين الطلبات النشطة'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء حذف الحساب'
        });
    }
});

// Delete Store Account
router.delete('/store', async (req, res) => {
    try {
        const { storeId } = req.userId;

        // Find the store
        const store = await Store.findById(storeId);

        // Find and cancel all active orders for this store
        const activeOrders = await Order.find({
            storeId: storeId,
            status: { $nin: ['confiremd', 'cancelled'] }
        });

        // Update each order status to cancelled
        for (const order of activeOrders) {
            order.status = 'cancelled';
            order.cancellationReason = 'تم حذف حساب المتجر';
            await order.save();
        }

        // Delete store's uploaded files
        await deleteUploadedFile(store.picture);

        // Delete the store
        await Store.findByIdAndDelete(storeId);

        res.status(200).json({
            error: false,
            data: 'تم حذف حساب المتجر بنجاح وإلغاء جميع الطلبات النشطة'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء حذف الحساب'
        });
    }
});

module.exports = router;