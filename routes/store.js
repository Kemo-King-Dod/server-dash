const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Ordre = require('../database/orders');
const Store = require('../database/store');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth')
const bcrypt = require('bcrypt');

router.get('/getStore', auth, async (req, res) => {
    try {
        const id = req.userId
        const store = await Store.findById(id, { password: 0, items: 0 })
        res.status(200).json({
            error: false,
            data: store
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.get('/getStores', async (req, res) => {
    try {
        var id = null;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
            const decoded = jwt.verify(token, JWT_SECRET);
            id = decoded.id;
        }

        if (!req.headers.cityen) {
            return res.status(400).json({
                error: true,
                message: "يرجى التحقق من تفعيل الموقع وإعطاء الإذن"
            });
        }
        const stores = await Store.find({ city: req.headers.cityen , registerCondition:"accepted"}, { password: 0, items: 0 })

        // Check if current time is between opening and closing times
        for (let i = 0; i < stores.length; i++) {
            // Add isFavorite property to each item
            stores[i]._doc.isFollow = false;
            stores[i]._doc.isFavorite = false;

            // check openCondition
            
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();

            // Parse store hours
            const openAMHour = parseInt(stores[i].opentimeam.split(':')[0]);
            const openAMMinute = parseInt(stores[i].opentimeam.split(':')[1]);
            const closeAMHour = parseInt(stores[i].closetimeam.split(':')[0]);
            const closeAMMinute = parseInt(stores[i].closetimeam.split(':')[1]);
            const openPMHour = parseInt(stores[i].opentimepm.split(':')[0]);
            const openPMMinute = parseInt(stores[i].opentimepm.split(':')[1]);
            let closePMHour = parseInt(stores[i].closetimepm.split(':')[0]);
            const closePMMinute = parseInt(stores[i].closetimepm.split(':')[1]);

            // Handle after-midnight closing times (e.g., 2:00 AM becomes 26:00)
            if (closePMHour < 7) {
                closePMHour += 24;
            }
            if (hours < 7) {
                if (closePMHour < 10) {
                    hours += 24;
                }
            }

            // Convert current time to minutes for easier comparison
            // the server time is 2 hours late from libya that is way i added + 120
            const currentTimeInMinutes = hours * 60 + 120 + minutes;
            const openAMInMinutes = openAMHour * 60 + openAMMinute;
            const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
            const openPMInMinutes = openPMHour * 60 + openPMMinute;
            const closePMInMinutes = closePMHour * 60 + closePMMinute;

            // Check if current time falls within either AM or PM opening hours
            stores[i].openCondition =
                (currentTimeInMinutes >= openAMInMinutes && currentTimeInMinutes <= closeAMInMinutes) ||
                (currentTimeInMinutes >= openPMInMinutes && currentTimeInMinutes <= closePMInMinutes)
            stores[i].save()
        }

        if (req.headers.isvisiter && req.headers.isvisiter == 'true') {
            return res.status(200).json({
                error: false,
                data: stores
            })
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < stores.length; i++) {
                for (var j = 0; j < user.favorateStors.length; j++) {
                    if (user.favorateStors[j].toString() == stores[i]._id.toString()) {
                        stores[i]._doc.isFavorite = true;
                    }
                }
                for (var j = 0; j < user.followedStores.length; j++) {
                    if (user.followedStores[j].toString() == stores[i]._id.toString()) {
                        stores[i]._doc.isFollow = true;
                    }
                }
            }
        }

        res.status(200).json({
            error: false,
            data: stores
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})


router.post('/alterStorePassword', auth, async (req, res) => {
    try {
        const userId = req.userId
        const store = await Store.findById(userId)
        const valied = await bcrypt.compare(req.body.currentPassword, store.password)
        if (valied) {
            const salt = await bcrypt.genSalt(10)
            store.password = await bcrypt.hash(req.body.newPassword, salt)
            await store.save()
            res.status(200).json({
                error: false,
                message: 'تم تحديث كلمة المرور بنجاح'
            })
        }
        else {
            res.status(401).json({
                error: true,
                message: 'كلمة المرور الحالية غير صحيحة'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err.message
        })
    }
})


// alter name
router.post('/alterStore', auth, async (req, res) => {
    try {
        const userId = req.userId
        const store = await Store.findById(userId)
        store.name = req.body.name
        store.storeType = req.body.category
        store.picture = req.body.picture
        await store.save()

        await Ordre.updateMany({ "store.id": req.userId }, {
            "store.name": req.body.name,
            "store.category": req.body.category,
            "store.picture": req.body.picture
        })

        res.status(200).json({
            error: false,
            message: 'تم تحديث البيانات بنجاح'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.post('/changeOpenTime', auth, async (req, res) => {
    try {
        const id = req.userId
        const { closetimeam, closetimepm, opentimeam, opentimepm } = req.body
        const store = await Store.findById(id, { password: 0, items: 0 })
        store.closetimeam = closetimeam
        store.closetimepm = closetimepm
        store.opentimeam = opentimeam
        store.opentimepm = opentimepm
        await store.save()
        res.status(200).json({
            error: false,
            data: {
                closetimeam,
                closetimepm,
                opentimeam,
                opentimepm
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

module.exports = router