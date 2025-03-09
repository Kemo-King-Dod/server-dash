const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Retrenchments = require('../database/retrenchments');

router.post('./retrenchments', auth, async (req, res) => {

    try {
        const userId = req.userId
        const { name, items, retrenchment_percent, retrenchment_start, retrenchment_end } = req.body

        await Retrenchments.create({
            name,
            items,
            store_id: userId,
            retrenchment_percent,
            retrenchment_start,
            retrenchment_end
        })
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