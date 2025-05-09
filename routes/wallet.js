const express = require("express");
const route = express.Router();
const Store = require("../database/store");
const Driver = require("../database/driver");
const User = require("../database/users");
const { auth } = require("../middleware/auth");
const Withdrawal = require("../database/withdrawal");
const Transaction = require("../database/transactions");

// user
route.get("/userWallet", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    res.status(200).json({
      moneyRecord: user.moneyRecord,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "user not found" });
  }
});

// store
route.get("/storeWallet", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const store = await Store.findById(userId);
    const lastWidrawal = await Withdrawal.find({
      storeId: store._id,
      status: { $in: ["onWay", "waiting"] },
    }).sort({ date: -1 });
    const transactionList = await Transaction.find({
      $or: [{ sender: store._id }, { receiver: store._id }],
    })
      .sort({ date: -1 })
      ;
    res.status(200).json({
      error: false,
      data: {
        // moneyRecord: store.moneyRecord,
        // totalCommission: store.totalCommission, // what he wants from us
        funds: store.funds,
        lastWidrawal: lastWidrawal.length > 0 && lastWidrawal[0].balance,
        withdrawalList: lastWidrawal,
        transactionList: transactionList,
      },
    });
    console.log(lastWidrawal);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "user not found" });
  }
});

//driver
route.get("/driverWallet", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const driver = await Driver.findById(userId);
    res.status(200).json({
      error: false,
      data: {
        funds: driver.funds,
        balance: driver.balance,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "user not found" });
  }
});

route.post("/addWithdrawal", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { balance } = req.body;
    const store = await Store.findById(userId);
    if (!store) {
      return res.status(400).json({ error: true, message: "المتجر غير موجود" });
    }
    if (balance > store.funds) {
      return res
        .status(400)
        .json({ error: true, message: "لا يمكن سحب اكثر من المبلغ المتاح" });
    }
    if (balance < 500) {
      return res
        .status(400)
        .json({ error: true, message: "لا يمكن سحب اقل من 500 د.ل" });
    }
    const lastWithdrawal = await Withdrawal.find({
      storeId: userId,
      status: { $in: ["waiting", "onWay"] },
    }).sort({ date: -1 });
    if (lastWithdrawal.length > 0) {
      return res.status(400).json({ error: true, message: "لقد تم طلب السحب مسبقا" });
    }
    const withdrawal = new Withdrawal({
      name: store.name,
      storeId: userId,
      balance: balance,
      status: "waiting",
    });
    await withdrawal.save();
    res.status(200).json({
      error: false,
      message: "تم اضافة السحب",    
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "لم يتم اضافة السحب" });
  }
});

route.post("/confirmWithdrawal", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(400).json({ error: true, message: "لم يتم ايجاد السحب" });
    }
    const store = await Store.findById(withdrawal.storeId);
    if (!store) {
      return res.status(400).json({ error: true, message: "المتجر غير موجود" });
    }
    store.funds -= withdrawal.balance;
    await store.save();
    withdrawal.status = "finished";
    await withdrawal.save();
    const transaction = new Transaction({
      sender: store._id,
      receiver: userId,
      amount: withdrawal.balance,
      type: "debit",
    });
    await transaction.save();
    res.status(200).json({
      error: false,
      message: "تم تأكيد السحب",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "withdrawal not confirmed" });
  }
});
route.get("/withdrawals", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const withdrawals = await Withdrawal.find({ storeId: userId });
    res.status(200).json({
      error: false,
      data: withdrawals,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "withdrawals not found" });
  }
});

module.exports = route;
