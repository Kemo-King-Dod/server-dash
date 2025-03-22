const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Ordre = require('../database/orders');
const Store = require('../database/store');
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
        const id = req.userId
        const stores = await Store.find({}, { password: 0, items: 0 })

        // Check if current time is between opening and closing times
        for (let i = 0; i < stores.length; i++) {
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
                console.log('----------------')
                console.log(closePMHour)
                closePMHour += 24;
                console.log(closePMHour)
                console.log('----------------')
            }

            if (hours < 7) {
                if (closePMHour < 10) {
                    console.log('+++++++++++++++++')
                    console.log(closePMHour)
                    hours += 24;
                    console.log(closePMHour)
                    console.log('+++++++++++++++++')
                }
            }

            // Convert current time to minutes for easier comparison
            const currentTimeInMinutes = hours * 60 + minutes;
            const openAMInMinutes = openAMHour * 60 + openAMMinute;
            const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
            const openPMInMinutes = openPMHour * 60 + openPMMinute;
            const closePMInMinutes = closePMHour * 60 + closePMMinute;

            console.log(stores[i].name)
            console.log(currentTimeInMinutes)
            console.log(openAMInMinutes)
            console.log(closeAMInMinutes)
            console.log(openPMInMinutes)
            console.log(closePMInMinutes)

            // Check if current time falls within either AM or PM opening hours
            stores[i].openCondition =
                (currentTimeInMinutes >= openAMInMinutes && currentTimeInMinutes <= closeAMInMinutes) ||
                (currentTimeInMinutes >= openPMInMinutes && currentTimeInMinutes <= closePMInMinutes)
        }

        if ((1403 >= 690 && 1403 <= 718) || (1403 >= 1230 && 1403 <= 1430))
            console.log(true)
        else
            console.log(false)


        if (req.headers.isvisiter && req.headers.isvisiter == 'true') {
            return res.status(200).json({
                error: false,
                data: stores
            })
        }

        // Add isFavorite property to each item
        for (var i = 0; i < stores.length; i++) {
            stores[i]._doc.isFollow = false;
            stores[i]._doc.isFavorite = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            for (var i = 0; i < stores.length; i++) {
                for (var j = 0; j < user.favorateStors.length; j++) {
                    if (user.favorateStors[j]._id.toString() == stores[i]._id.toString()) {
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

        for (let i = 0; i < stores.length; i++) {
            console.log(stores[i].openCondition)
            await stores[i].save()
        }
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