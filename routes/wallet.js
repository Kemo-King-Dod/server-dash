const express = require("express");
const route = express.Router();
const Store = require("../database/store");
const Driver = require("../database/driver");
const User = require("../database/users");
const { auth } = require("../middleware/auth");
const Withdrawal = require("../database/withdrawal");
const Transaction = require("../database/transactions");

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
        const lastWidrawal = await Withdrawal.find({ storeId: store._id }).sort({ date: -1 }).limit(1);
        const transactionList = await Transaction.find({ $or: [{ sender: store._id }, { receiver: store._id }] }).sort({ date: -1 }).limit(1);
        res.status(200).json({
            error: false,
            data: {
                // moneyRecord: store.moneyRecord,
                // totalCommission: store.totalCommission, // what he wants from us
                funds: store.funds,
                lastWidrawal: lastWidrawal.length > 0 && lastWidrawal[0].balance,
                withdrawalList: lastWidrawal.filter(withdrawal => withdrawal.status === 'onWay'),
                transactionList: transactionList,



            }
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
            error: false,
            data: {
                funds: driver.funds,
                balance: driver.balance
            }
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: true, message: "user not found" })
    }
})


module.exports = route
