const express = require("express")
const route = express.Router()
const orders_record = require("../database/orders_record")
const Driver = require("../database/driver")
const Store = require("../database/store")
const { auth } = require('../middleware/auth');
const { sendNotification } = require("../firebase/notification")

route.get('/checkRating', auth, async (req, res) => {
    try {
        const data = await orders_record.find({ "customer.id": req.user._id, rate: 'needRate' })
        res.status(200).json({
            error: false,
            data: data
        })
    } catch (error) {
        res.status(200).json({
            error: true,
            message: 'حدث خطأ أثناء التحقق من التقييم'
        })
    }
})
route.post('/submitRating"', auth, async (req, res) => {
    try {
        const { driverId, shopId, shopRateing, driverRateing, comment } = req.body

        const store = await Store.findById(shopId)
        const driver = await Driver.findById(driverId)

        store.rating += shopRateing
        driver.rating += driverRateing

        store.ratingUsers++
        driver.ratingUsers++

        store.rate = store.ratingUsers / store.rating
        driver.rate = driver.ratingUsers / driver.rating

        await store.save()
        await driver.save()



        res.status(200).json({
            error: false,
            message: 'تم رفع التقييم بنجاح'
        });
        try {
            const admins = ['0922224420', '0928779303', "0921441000"]
            const adminsdocs = await User.find({ phone: { $in: admins } });
            adminsdocs.forEach(async admin => {
                await Notification.create({
                    title: req.user.name + ' ' + req.user.phone,
                    message: comment,
                    userId: admin._id
                });

            });
            sendNotification({ token: adminsdocs.map(admin => admin.phone == "0928779303" ? admin.fcmToken : ""), title: 'تقييم جديد', body: comment })


        } catch (error) {
            console.log(error)

        }

    } catch (error) {
        res.status(200).json({
            error: true,
            message: 'حدث خطأ أثناء رفع التقييم'
        })
    }
})


route.get('/Rating', auth, async (req, res) => {
    try {
        const { driverId, shopId, shopRateing, driverRateing } = req.body

        const store = await Store.findById(shopId)
        const driver = await Driver.findById(driverId)

        store.rating += shopRateing
        driver.rating += driverRateing

        store.ratingUsers++
        driver.ratingUsers++

        store.rate = store.ratingUsers / store.rating
        driver.rate = driver.ratingUsers / driver.rating

        await store.save()
        await driver.save()

        res.status(200).json({
            error: false
        })
    } catch (error) {
        res.status(200).json({
            error: true,
            message: 'حدث خطأ أثناء رفع التقييم'
        })
    }
})

module.exports = route