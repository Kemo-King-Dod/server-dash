const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Item = require('../database/items');
const Retrenchments = require('../database/Retrenchments');

router.post('/discount', auth, async (req, res) => {
    try {
        console.log(req.body)
        const userId = req.userId
        const { name, applicableProducts, percent, startDate, endDate } = req.body

        const discount = {
            name,
            items: applicableProducts,
            store_id: userId,
            retrenchment_percent: percent,
            retrenchment_start: startDate,
            retrenchment_end: endDate
        }
        let r = await Retrenchments.create(discount)
        console.log(r)

        // make discount for items
        await Item.updateMany(
            {
                _id: { $in: applicableProducts }
            },
            {
                $set: {
                    is_retrenchment: true,
                    retrenchment_percent: percent
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


module.exports = router