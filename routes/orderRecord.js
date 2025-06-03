const express = require("express");
const router = express.Router();
const OrderRecord = require("../database/orders_record");
const { auth } = require("../middleware/auth");
const mongoose = require("mongoose");

router.get("/orderRecordForStore", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const records = await OrderRecord.find({ "store.id": new mongoose.Types.ObjectId(userId) });

        return res.status(200).json({
            error: false,
            data: records
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

// get Order Record For User

router.get("/orderRecordForUser", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const records = await OrderRecord.find({ "customer.id": new mongoose.Types.ObjectId(userId) });

        return res.status(200).json({
            error: false,
            data: records
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})


// get Order Record For Driver
router.get("/orderRecordForDriver", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const records = await OrderRecord.find({ "driver.id": userId });

        return res.status(200).json({
            error: false,
            data: records
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})


module.exports = router;