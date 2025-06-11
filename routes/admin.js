const express = require("express");
const router = express.Router();
const User = require("../database/users");
const Driver = require("../database/driver");
const Store = require("../database/store");
const Order = require("../database/orders");
const orders_record = require("../database/orders_record");
const Retrenchments = require("../database/Retrenchments");
const items = require("../database/items");
const notification = require("../database/notification");
const Info = require("../database/info");

const { auth } = require("../middleware/auth");
const Transaction = require("../database/transactions");

// general

router.get(
  "/getInfo",
  /* auth, */ async (req, res) => {
    try {
      const info = await Info.find();
      res.status(200).json({
        error: false,
        data: info,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);

// stores
router.get(
  "/adminGetStores",
  /* auth, */ async (req, res) => {
    try {
      const stores = await Store.find({}, { password: false, items: false });
      res.status(200).json({
        error: false,
        data: stores,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);

router.post(
  "/block_store",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await Store.updateOne({ phone }, { registerCondition: "blocked" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post(
  "/unblock_store",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await Store.updateOne({ phone }, { registerCondition: "active" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post("/search_for_store", async (req, res) => {
  try {
    const { phone } = req.body;
    const store = await Store.findOne({ phone }, { password: 0 });

    res.status(200).json({
      error: false,
      data: store,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// drivers
router.get(
  "/adminGetDrivers",
  /* auth, */ async (req, res) => {
    try {
      const drivers = await Driver.find({}, { password: false });
      res.status(200).json({
        error: false,
        data: drivers,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);

router.get(
  "/getAllDrivers",
  /* auth, */ async (req, res) => {
    try {
      const drivers = await Driver.find();
      res.json({
        error: false,
        data: drivers,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post(
  "/block_driver",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await Driver.updateOne({ phone }, { status: "blocked" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post(
  "/unblock_driver",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await Driver.updateOne({ phone }, { status: "active" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post("/search_for_driver", async (req, res) => {
  try {
    const { phone } = req.body;
    const driver = await Driver.findOne({ phone }, { password: 0 });

    res.status(200).json({
      error: false,
      data: driver,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// users
router.get(
  "/adminGetUsers",
  /* auth, */ async (req, res) => {
    try {
      const users = await User.find({}, { password: false });
      res.status(200).json({
        error: false,
        data: users,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);

router.post(
  "/block_user",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await User.updateOne({ phone }, { registerCondition: "blocked" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post(
  "/unblock_user",
  /* auth, */ async (req, res) => {
    try {
      const { phone } = req.body;

      await User.updateOne({ phone }, { registerCondition: "active" });
      res.json({
        error: false,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
);
router.post("/search_for_customer", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone }, { password: 0 });

    res.status(200).json({
      error: false,
      data: user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

router.get(
  "/TransactionsForAdmin",
  /* auth, */ async (req, res) => {
    try {
      const transactions = await Transaction.find({});
      return res.status(200).json({
        error: false,
        data: {transactions},
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        error: true,
        message: e,
      });
    }
  }
),
  (module.exports = router);

/* 
// store
sendNotification({ token: user.fcmToken, title: 'تم سحب الرصيد من حسابك في الشركة', body: 'تم سحب الرصيد من حسابك في الشركة' })
            await notification.create({
                id: store._id,
                userType: 'store',
                title: 'تم سحب الرصيد من حسابك في الشركة',
                body: 'تم سحب الرصيد من حسابك في الشركة',
                type: 'info'
            })


// driver
sendNotification({ token: user.fcmToken, title: 'تم زيادة قيمة المستحقات', body: 'تم زيادة قيمة المستحقات' })
            await notification.create({
                id: driver._id,
                userType: 'driver',
                title: 'تم زيادة قيمة المستحقات',
                body: 'تم زيادة قيمة المستحقات',
                type: 'info'
            })

sendNotification({ token: user.fcmToken, title: 'تم دفع المستحقات للشركة', body: 'تم دفع المستحقات للشركة' })
            await notification.create({
                id: driver._id,
                userType: 'driver',
                title: 'تم دفع المستحقات للشركة',
                body: 'تم دفع المستحقات للشركة',
                type: 'info'
            })

*/
