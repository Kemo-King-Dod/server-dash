const express = require("express")
const route = express.Router()
const orders_record = require("../database/orders_record")
const Driver = require("../database/driver")
const Store = require("../database/store")
const { auth } = require('../middleware/auth');

route.get('/checkRating', auth, async (req, res) => {
    try {
        const data = await orders_record.find({"customer.id": req.user._id, rate: 'needRate'})
        res.status(200).json({
            error:false,
            data: data
        })
    } catch (error) {
        res.status(200).json({
            error: true,
            message: 'حدث خطأ أثناء التحقق من التقييم'
        })
    }
})


route.get('/Rating', auth, async (req, res) => {
    try {
        const {driverId , shopId, shopRateing,driverRateing} = req.body

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
            error:false
        })
    } catch (error) {
        res.status(200).json({
            error: true,
            message: 'حدث خطأ أثناء رفع التقييم'
        })
    }
})

module.exports = route