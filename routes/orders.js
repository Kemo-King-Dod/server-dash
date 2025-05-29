const express = require("express");
const router = express.Router();
const Order = require("../database/orders");
const OrderRecodr = require("../database/orders_record");
const Store = require("../database/store");
const Driver = require("../database/driver");
const Address = require("../database/address");
const User = require("../database/users");
const Item = require("../database/items");
const fs = require("fs").promises;
const path = require("path");
const { auth } = require("../middleware/auth");
const mongoose = require("mongoose");
const notification = require("../database/notification");
const {
  sendNotification,
  sendNotificationToTopic,
} = require("../firebase/notification");
const getCityName = require("../utils/getCityName");
const Transaction = require("../database/transactions");
const { error } = require("console");
const driver = require("../database/driver");
const orders = require("../database/orders");

let ordersNum;

async function read() {
  const data = await fs.readFile(
    path.join(__dirname, "..", "data", "order.txt")
  );
  ordersNum = parseInt(data.toString());
  await fs.writeFile(
    path.join(__dirname, "..", "data", "order.txt"),
    `${++ordersNum}`
  );
  return ordersNum;
}
router.get("/getAllOrders",auth,async(req,res)=>{
  var Orders = await orders.find({});
  return res.status(200).json({
    error:false,
    data : Orders
  })
})

// orders [add , delete , change state]
router.post("/addOrder", auth, async (req, res) => {
  try {

    return res.status(500).json({
      error: true,
      message: "سيتم الإطلاق قريباً",
    })

    const itemsdata = [];
    const userId = req.userId;
    const StoreId = req.body.storeId;
    const theAddress = await Address.findById(req.body.addressId);
    const store = await Store.findById(StoreId);
    const user = await User.findById(userId);
    let totalprice = 0;

    if (store.city != req.headers.cityen) {
      return res.status(500).json({
        error: true,
        message: "المحل غير موجود في هذه المدينة",
      })
    }

    for (var i = 0; i < user.cart.length; i++) {
      if (user.cart[i].cartItem.storeID == StoreId) {
        const item = await Item.findById(user.cart[i].cartItem.id);
        itemsdata.push({
          id: item._id,
          name: item.name,
          options: user.cart[i].cartItem.options,
          addOns: user.cart[i].cartItem.addOns,
          quantity: 1, // update later
          price: user.cart[i].cartItem.price,
        });
        totalprice += user.cart[i].cartItem.price;
      }
    }

    if (itemsdata.length == 0) {
      res.status(500).json({
        error: true,
        message: "ليس هناك عناصر",
      });
      return;
    }
    // Create new order
    console.log("theAddress", theAddress);
    const order = new Order({
      orderId: await read(),
      city: {
        englishName: getCityName(theAddress).englishName,
        arabicName: getCityName(theAddress).arabicName,
      },
      customer: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
      },
      store: {
        id: store._id,
        phone: store.phone,
        name: store.name,
        picture: store.picture,
        deliveryCostByKilo: store.deliveryCostByKilo,
        storeType: store.storeType,
        location: store.location,
        address: store.address,
      },
      driver: null,
      companyFee: (store.deliveryCostByKilo * 20) / 100,
      date: new Date(),
      items: itemsdata,
      totalPrice: totalprice,
      status: store.ByCode ? "waiting" : "ready",
      type: store.ByCode ? "waiting" : "ready",
      address: theAddress,
      distenationPrice: store.deliveryCostByKilo,
      chat: [],
      ByCode: store.ByCode,
    });

    if (order.city.englishName != req.headers.cityen) {
      return res.status(401).json({
        error: true,
        message: "لا يمكن الطلب من خارج مدينتك"
      })
    }

    // Save order
    await order.save();

    const theorderId = await Order.findOne({ orderId: ordersNum });

    // Update store's orders array
    await Store.findByIdAndUpdate(StoreId, {
      $push: { orders: theorderId._id },
    });

    // Update user's orders array
    await User.findByIdAndUpdate(userId, { $push: { orders: theorderId._id } });

    // delete from cart
    for (var i = 0; i < user.cart.length; i++) {
      if (user.cart[i].cartItem.storeID == StoreId) {
        user.cart.splice(i, 1);
        i--;
      }
    }
    await user.save();

    await sendNotification({
      token: store.fcmToken,
      title: "طلبية جديدة",
      body: "قام زبون ما بطلب طلبية من متجرك",
    });
    await notification.create({
      id: store._id,
      userType: "store",
      title: "طلبية جديدة",
      body: "قام زبون ما بطلب طلبية من متجرك",
      type: "info",
    });

    res.status(200).json({
      error: false,
      message: "Order added successfully",
      data: theorderId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: error.message,
    });
  }
});

router.post("/acceptOrder", auth, async (req, res) => {
  try {
    const id = req.body.orderId;
    const order = await Order.findById(id);
    if (order) {
      const user = await User.findById(order.customer.id);
      order.status = "accepted";
      order.type = "accepted";
      await order.save();
      sendNotification({
        token: user.fcmToken,
        title: "تم قبول طلبك",
        body: "قام المتجر بقبول طلبك ويتم الآن تجهيز الطلبية",
      });
      await notification.create({
        id: order.customer.id,
        userType: "user",
        title: "تم قبول طلبك",
        body: "قام المتجر بقبول طلبك ويتم الآن تجهيز الطلبية",
        type: "info",
      });
      return res.status(200).json({
        error: false,
        data: order,
      });
    }
    res.status(500).json({
      error: true,
      message: "الطلب غير موجود",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

router.post("/readyOrder", auth, async (req, res) => {
  try {
    const id = req.body.orderId;
    const order = await Order.findById(id);
    if (order) {
      order.status = "ready";
      order.type = "ready";
      await order.save();
    } else {
      res.status(500).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }

    res.status(200).json({
      error: false,
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

// user
router.get("/getOrdersForUser", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({
      "customer.id": new mongoose.Types.ObjectId(userId),
    });

    for (let i = 0; i < orders.length; i++) {
      orders[i].reserveCode = "";
    }

    res.status(200).json({
      error: false,
      data: orders,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

// store
router.get("/getOrdersForStore", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({
      "store.id": new mongoose.Types.ObjectId(userId),
    });

    res.status(200).json({
      error: false,
      data: orders,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

// driver
router.get("/getReadyOrderForDriver", auth, async (req, res) => {
  try {
    const id = req.userId;
    console.log("req.headers.cityen", req.headers.cityen);
    const acceptedorders = await Order.find({
      "driver.id": id,
      status: { $in: ["driverAccepted", "onWay", "delivered"] },
    });
    if (!req.user.userType === "admin" && acceptedorders.length >= 3) {
      return res.status(200).json({
        error: true,
        data: acceptedorders,
      });
    }
    const order = await Order.aggregate([
      {
        $match: {
          status: { $in: ["ready"] },
          "city.englishName": req.headers.cityen,
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    if (order.length == 0 && acceptedorders.length == 0) {
      return res.status(200).json({
        error: false,
        message: "ليس هناك طلبات جاهزة حتى الآن",
      });
    }
    if (acceptedorders.length > 0) {
      order.push(...acceptedorders);

    }
    console.log(" orders", order)
    console.log(" accept orders", acceptedorders)


    res.status(200).json({
      error: false,
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});
router.get("/getAcceptedOrdersForDriver", auth, async (req, res) => {
  try {
    const id = req.userId;
    const orders = await Order.find({
      "driver.id": id,
      status: "driverAccepted",
    });
    res.status(200).json({
      error: false,
      data: orders,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});

router.post("/driverAcceptOrder", auth, async (req, res) => {
  try {
    const id = req.body.orderId;
    const driver = await Driver.findById(req.userId);
    console.log("req.headers", req.headers);
    console.log("req.headers.cityen", req.headers.cityen);
    const acceptedordersCount = await Order.countDocuments({
      "driver.id": req.user.id.toString(),
      status: { $in: ["driverAccepted", "onWay", "delivered"] },
    });

    if (driver.cancelOrderLimit >= 5) {
      return res.status(403).json({
        error: true,
        data: "تم حظر حسابك بسبب كثرة إلغاء الطلبات",
      });
    } else {
      console.log("driver.cancelOrderLimit", driver.cancelOrderLimit);

    }

    if (req.user.userType !== "admin" && acceptedordersCount >= 3) {
      return res.status(200).json({
        error: true,
        message: "لقد وصلت الى الحد الاقصى للطلبات"
      });
    } else {
      console.log("accept order for driver", acceptedordersCount);
    }


    const order = await Order.findById(id);
    if (order.status == "ready") {
      if (order) {
        order.status = order.ByCode ? "driverAccepted" : "onWay";
        order.type = order.ByCode ? "driverAccepted" : "onWay";
        order.driver = {
          id: req.userId,
          name: driver.name,
          gender: driver.gender,
          phone: driver.phone,
        };
        console.log(order.driver);
        await order.save();

        res.status(200).json({
          error: false,
          data: order,
        });
      } else {
        res.status(500).json({
          error: true,
          message: "الطلب غير موجود",
        });
      }
    } else {
      return res.status(500).json({
        error: true,
        message: "لقد تم قبول الطلب من سائق اخر",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

// examine code
router.post("/examineCode", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.body.orderId);
    if (order) {
      order.status = "onWay";
      order.type = "onWay";
      await order.save();

      const store = await Store.findById(order.store.id);
      store.funds += order.totalPrice;
      await store.save();

      const transaction = new Transaction({
        receiver: store._id,
        sender: order.driver.id,
        amount: order.totalPrice,
        type: "credit",
        description: "طلبية رقم " + order.orderId,
      });
      await transaction.save();
      const driver = await Driver.findById(order.driver.id);
      console.log(driver);
      if (!driver._doc.funds) driver._doc.funds = order.totalPrice;
      else driver._doc.funds += order.totalPrice;
      await driver.save();

      res.status(200).json({
        error: false,
        data: "تمت العملية بنجاح",
      });
    } else {
      res.status(500).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

router.post("/confirmOrder", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.body.orderId);
    const driver = await Driver.findById(new mongoose.Types.ObjectId(order.driver.id));
    const user = await User.findById(new mongoose.Types.ObjectId(order.customer.id));

    if (!order) {
      return res.status(404).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }
    if (!driver) {
      return res.status(404).json({
        error: true,
        message: "السائق غير موجود",
      });
    }
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "المستخدم غير موجود",
      });
    }
    try {
      driver.funds += order.companyFee;
      driver.balance += order.distenationPrice;
      await driver.save();
    } catch (err) {
      console.log(err);
      await notification.create({
        id: order.driver.id,
        userType: "driver",
        title: "حصل خطأ في تعديل مستحقات الشركة في رقم الطلبية ذات الرقم " + order.orderId + " id =" + order._id,
        body: "يرجى التوجه إلى المكتب الرئيسي للتعديل",
        type: "warning",
      });
      return res.status(500).json({
        error: true,
        message: "حصل خطأ في تعديل مستحقات ",
      });
    }

    // Create record in OrderRecord collection
    const orderRecord = new OrderRecodr({
      orderId: order.orderId,
      customer: order.customer,
      driver: order.driver,
      store: order.store,
      date: order.date,
      items: order.items,
      totalPrice: order.totalPrice,
      status: "confirmed",
      type: "confirmed",
      address: order.address,
      distenationPrice: order.distenationPrice,
      reseveCode: order.reseveCode,
      chat: order.chat,
      canceledby: null,
    });
    await orderRecord.save();


    User.findByIdAndUpdate(order.customer.id, { orders: { $pull: order._id } });
    sendNotification({
      token: user.fcmToken,
      title: "تم تسليم طلبك",
      body: "نتمنى أن الخدمة قد نالت رضاكم",
    });
    await notification.create({
      id: order.customer.id,
      userType: "user",
      title: "تم تسليم طلبك",
      body: "نتمنى أن الخدمة قد نالت رضاكم",
      type: "success",
    });


    // Delete original order
    await Order.findByIdAndDelete(req.body.orderId);

    res.status(200).json({
      error: false,
      message: "تم تأكيد الطلب بنجاح",
      data: orderRecord,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error confirming order",
      error: err.message,
    });
  }
});

router.post("/cancelOrderUser", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    const order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(404).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }

    // Create record in OrderRecord collection
    const orderRecord = new OrderRecodr({
      orderId: order.orderId,
      customer: order.customer,
      driver: order.driver,
      store: order.store,
      date: order.date,
      items: order.items,
      totalPrice: order.totalPrice,
      status: "canceled",
      type: "canceled",
      address: order.address,
      distenationPrice: order.distenationPrice,
      reseveCode: order.reseveCode,
      chat: order.chat,
      canceledby: "user",
    });
    await orderRecord.save();

    // Delete original order
    await Order.findByIdAndDelete(req.body.orderId);

    // Increment cancel limit
    user.cancelOrderLimit = (user.cancelOrderLimit || 0) + 1;
    if (user.cancelOrderLimit >= 5) {
      user.status = "blocked";
    }
    User.findByIdAndUpdate(order.customer.id, { orders: { $pull: order._id } });

    await user.save();

    res.status(200).json({
      error: false,
      data: {
        message: "تم إلغاء الطلب بنجاح",
        remainingCancels: 5 - user.cancelOrderLimit,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error cancelling order",
      error: err.message,
    });
  }
});

router.post("/cancelOrderStore", auth, async (req, res) => {
  try {
    console.log("req.body", req.body);
    const order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(404).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }

    // Create record in OrderRecord collection
    const orderRecord = new OrderRecodr({
      orderId: order.orderId,
      customer: order.customer,
      driver: order.driver,
      store: order.store,
      date: order.date,
      items: order.items,
      totalPrice: order.totalPrice,
      status: "canceled",
      type: "canceled",
      address: order.address,
      distenationPrice: order.distenationPrice,
      reseveCode: order.reserveCode,
      chat: order.chat,
      canceledby: "store",
    });
    await orderRecord.save();

    // Delete original order
    await Order.findByIdAndDelete(req.body.orderId);

    const updatedUser = await User.findByIdAndUpdate(
      order.customer.id,
      { orders: { $pull: order._id } },
      { new: true }
    );
    console.log("updatedUser", updatedUser);
    if (req.body.reason != "") {
      if (req.body.unavailableProducts.length > 0) {
        const unavailableProducts = req.body.unavailableProducts
          .map((product) => product.name)
          .join(", ");
        await sendNotification({
          token: updatedUser.fcmToken,
          title: "تم إلغاء طلبك",
          body:
            "تم إلغاء طلبك بسبب" +
            req.body.reason +
            " ولم يتم توفير بعض المنتجات مثل " +
            unavailableProducts,
        });
        await notification.create({
          id: updatedUser._id,
          userType: "user",
          title: "تم إلغاء طلبك",
          body:
            "تم إلغاء طلبك بسبب" +
            req.body.reason +
            " ولم يتم توفير بعض المنتجات مثل " +
            unavailableProducts,
          type: "success",
        });
      } else {
        await sendNotification({
          token: updatedUser.fcmToken,
          title: "تم إلغاء طلبك",
          body: "تم إلغاء طلبك بسبب" + req.body.reason,
        });
        await notification.create({
          id: updatedUser._id,
          userType: "user",
          title: "تم إلغاء طلبك",
          body: "تم إلغاء طلبك بسبب" + req.body.reason,
          type: "success",
          date: new Date(),

        });
      }
    } else {
      if (req.body.unavailableProducts.length > 0) {
        const unavailableProducts = req.body.unavailableProducts
          .map((product) => product.name)
          .join(", ");
        await sendNotification({
          token: updatedUser.fcmToken,
          title: "تم إلغاء طلبك",
          body:
            "تم إلغاء طلبك " +
            " ولم يتم توفير بعض المنتجات مثل " +
            unavailableProducts,
        });
        await notification.create({
          id: updatedUser._id,
          userType: "user",
          title: "تم إلغاء طلبك",
          body:
            "تم إلغاء طلبك بسبب" +
            req.body.reason +
            " ولم يتم توفير بعض المنتجات مثل " +
            unavailableProducts,
          type: "success",
        });
      } else {
        await sendNotification({
          token: updatedUser.fcmToken,
          title: "تم إلغاء طلبك",
          body: "تم إلغاء طلبك ",
        });
        await notification.create({
          id: updatedUser._id,
          userType: "user",
          title: "تم إلغاء طلبك",
          body: "تم إلغاء طلبك بسبب" + req.body.reason,
          type: "success",
        });
      }
    }

    res.status(200).json({
      error: false,
      message: "تم إلغاء الطلب بنجاح",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error cancelling order",
      error: err.message,
    });
  }
});

router.post("/cancelOrderDriver", auth, async (req, res) => {
  try {
    const driverId = req.userId;
    const driver = await Driver.findById(driverId);
    const order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(404).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }

    if (order.status == "onWay") {
      order.status = "canceled";
      order.type = "canceled";
      // Increment cancel limit
      driver.cancelOrderLimit = (driver.cancelOrderLimit || 0) + 1;
      if (driver.cancelOrderLimit >= 5) {
        driver.status = "blocked";
      }
      await driver.save();
      User.findByIdAndUpdate(order.customer.orderId, {
        orders: { $pull: order._id },
      });
    } else {
      order.status = "ready";
      order.type = "ready";
      order.driver = null;
    }
    await order.save();

    res.status(200).json({
      error: false,
      data: {
        message: "تم إلغاء الطلب بنجاح",
        remainingCancels: 5 - driver.cancelOrderLimit,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: "Error cancelling order",
      error: err.message,
    });
  }
});

module.exports = router;
