const express = require("express");
const route = express.Router();
const path = require("path");
const jwt = require("jsonwebtoken");
const Store = require("../database/store");
const Driver = require("../database/driver");
const User = require("../database/users");
const { auth } = require("../middleware/auth");

// user
route.get('/userWallet', auth, async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId);
        res.status(200).json({
            moneyRecord: user.moneyRecord
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: true, message: "user not found" })
    }

})

// store
route.get('/storeWallet', auth, async (req, res) => {
    try {
        const userId = req.userId
        const store = await Store.findById(userId);
        res.status(200).json({
            moneyRecord: store.moneyRecord,
            totalCommission: store.totalCommission,
            funds: store.funds
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: true, message: "user not found" })
    }
})

//driver
route.get('/driverWallet', auth, async (req, res) => {
    try {
        const userId = req.userId
        const driver = await Driver.findById(userId);
        res.status(200).json({
            funds: driver.funds,
            balance: driver.balance
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: true, message: "user not found" })
    }
})


module.exports = route
