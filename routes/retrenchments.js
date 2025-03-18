const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Item = require('../database/items');
const Retrenchments = require('../database/Retrenchments');

router.post('/discount', auth, async (req, res) => {
    try {
        const userId = req.userId
        const { name, applicableProducts, percent, startDate, endDate } = req.body.discountDetails

        const discount = {
            name,
            items: applicableProducts,
            store_id: userId,
            retrenchment_percent: percent,
            retrenchment_start: startDate,
            retrenchment_end: endDate
        }
        await Retrenchments.create(discount)

        // make discount for items
        await Item.updateMany(
            {
                _id: { $in: applicableProducts }
            },
            {
                $set: {
                    is_retrenchment: true,
                    retrenchment_percent: percent,
                    retrenchment_end: endDate
                }
            }
        )

        res.status(200).json({
            error: false,
            message: 'تم إضافة التخفيض بنجاح',
        })
    } catch (error) {
        console.log(error);
        res.status(401).json({
            error: true,
            message: error.message,
        })
    }
})


// get all retrenchments
router.get('/getAllDiscounts', auth, async (req, res) => {
    try {
        const userId = req.userId
        const retrenchments = await Retrenchments.find({ store_id: userId })
        res.status(200).json({
            error: false,
            retrenchments
        })
    } catch (error) {
        console.log(error);
        res.status(401).json({
            error: true,
            message: error.message,
        })
    }
})


// delete retrenchment
router.post('/deleteDiscount', auth, async (req, res) => {
    try {
        const { id } = req.body
        await Retrenchments.findByIdAndDelete(id)
        res.status(200).json({
            error: false,
            message: 'تم حذف التخفيض بنجاح'
        })
    } catch (error) {
        console.log(error);
        res.status(401).json({
            error: true,
            message: error.message,
        })
    }
})


module.exports = router