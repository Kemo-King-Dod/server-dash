const express = require("express");
const router = express.Router();
const Order = require("../database/orders");
const OrderRecord = require("../database/orders_record");
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
const orders = require("../database/orders");
const Admin = require("../database/admin");
const { notifyStakeholders } = require("../utils/notifyStakeholders");
const Info = require("../database/info");

let ordersNum;

// ***********************
async function read() {
  try {
    const result = await Info.findOneAndUpdate(
      {},                            // لا شرط لأنك تضمن وجود وثيقة واحدة فقط
      { $inc: { orders_number: 1 } },// زيادة orders_number بمقدار 1
      {
        returnOriginal: false,       // إرجاع الوثيقة بعد التحديث (لـ Mongoose)
        upsert: true                 // إنشاء الوثيقة إذا لم تكن موجودة (اختياري)
      }
    );

    return result.orders_number;

  } catch (error) {
    console.error("خطأ أثناء تحديث orders_number:", error);
    throw error;
  }
}

// ***********************

router.get("/getAllOrders", auth, async (req, res) => {
  var Orders = await orders.find({});
  return res.status(200).json({
    error: false,
    data: {
      orders: Orders,
    },
  });
});

// orders [add , delete , change state]
router.post("/addOrder", auth, async (req, res) => {
  try {
    if (req.userId !== "682e92122f76a6aadd90d682") {
      return res.status(500).json({
        error: true,
        message: "سيتم الإطلاق قريباً",
      });
    } else {
      const itemsdata = [];
      const userId = req.userId;
      const StoreId = req.body.storeId;
      const theAddress = await Address.findById(req.body.addressId);
      const store = await Store.findById(StoreId);
      const admin = await Admin.findOne({ phone: "0910808060" });
      const user = await User.findById(userId);
      const deliveryPrice = req.body.deliveryPrice;
      let totalprice = 0;
      let activeOrderCount = await Order.countDocuments({ "customer.id": new mongoose.Types.ObjectId(req.userId), status: { $in: ['waiting', 'accepted', 'ready', "driverAccepted", "onWay"] } });
      console.log("count: %d", activeOrderCount)

      // if (activeOrderCount >= 3) {
      //   return res.status(500).json({
      //     error: true,
      //     message: "لديك 3 طلبيات جارية بالفعل الرجاء الانتظار الى حين انتهاء احد الطلبيات",
      //   });
      // }

      if (store.city != getCityName(theAddress).englishName) {
        return res.status(500).json({
          error: true,
          message: "المحل غير موجود في هذه المدينة",
        });
      }


      for (var i = 0; i < user.cart.length; i++) {
        if (user.cart[i].cartItem.storeID == StoreId) {
          const item = await Item.findById(user.cart[i].cartItem.id);
          itemsdata.push({
            id: item._id,
            name: item.name,
            image: item.imageUrl,
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
      if (
        getCityName(theAddress).englishName !==
        getCityName(store.location).englishName
      ) {
        res.status(500).json({
          error: true,
          message: "لا يمكن الطلب من مدن مختلفة",
        });
        return;
      }
      // Create new order
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
        companyFee: store.companyFee,
        date: new Date(),
        items: itemsdata,
        totalPrice: totalprice,
        status: "waiting",
        type: "waiting",
        address: theAddress,
        distenationPrice: deliveryPrice,
        chat: [],
        ByCode: store.ByCode,
        handcheck: store.handcheck,
      });

      if (order.city.englishName != req.headers.cityen) {
        return res.status(401).json({
          error: true,
          message: "لا يمكن الطلب من خارج مدينتك",
        });
      }

      // Save order
      await order.save();

      // const theorderId = await Order.findOne({ orderId: ordersNum });
      const theorderId =order.toObject();
      // const theorderId = await Order.findOne({ _id: order._id });

      // Update store's orders array
      await Store.findByIdAndUpdate(StoreId, {
        $push: { orders: theorderId._id },
      });

      // Update user's orders array
      await User.findByIdAndUpdate(userId, {
        $push: { orders: theorderId._id },
      });

      // delete from cart
      for (var i = 0; i < user.cart.length; i++) {
        if (user.cart[i].cartItem.storeID == StoreId) {
          user.cart.splice(i, 1);
          i--;
        }
      }
      await user.save();

      try {
        sendNotification({
          token: store.fcmToken,
          title: "طلبية جديدة",
          body: "قام زبون ما بطلب طلبية من متجرك",
        });
      } catch (e) {
        console.log("المتجر لم يستلم الاشعار");
      }
      try {
        sendNotification({
          token: admin.fcmToken,
          title: "طلبية جديدة",
          body: ` قام زبون ما بطلب طلبية من متجر ${store.name}`,
        });
      } catch (e) {
        console.log("الادمن لم يستلم الاشعار");
      }
      try {
        sendNotificationToTopic({
          topic: "admins_" + req.headers.cityen,
          title: "طلبية جديدة",
          body: ` قام زبون ما بطلب طلبية من متجر ${store.name}`,
        });
      } catch (e) {
        console.log("الادمن لم يستلم الاشعار");
      }

      await notification.create({
        id: store._id,
        userType: "store",
        title: "طلبية جديدة",
        body: "قام زبون ما بطلب طلبية من متجرك",
        type: "info",
      });

      return res.status(200).json({
        error: false,
        message: "Order added successfully",
        data: theorderId,
      });
    }
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
    const store = await Store.findById(order.store.id);

    if (order) {
      const user = await User.findById(order.customer.id);
      order.status = store.ByCode ? "accepted" : "ready";
      order.type = store.ByCode ? "accepted" : "ready";
      await order.save();
      if (!store.ByCode) {
        sendNotificationToTopic({
          topic: `${order.city.englishName.toLowerCase()}_drivers`,
          title: "طلبية جديدة",
          body: "هناك طلبية جديدة سارع بقبولها",
        });
      }
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

    if (store.ByCode == false) {
      sendNotificationToTopic({
        topic: `${order.city.englishName}Drivers`,
        title: "طلبية جديدة",
        body: "هناك طلبية جديدة سارع بقبولها",
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
      sendNotificationToTopic({
        topic: `${order.city.englishName.toLowerCase()}_drivers`,
        title: "طلبية جديدة",
        body: "هناك طلبية جديدة سارع بقبولها",
      });
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
    }

    if (req.user.userType !== "admin" && acceptedordersCount >= 3) {
      return res.status(200).json({
        error: true,
        message: "لقد وصلت الى الحد الاقصى للطلبات",
      });
    } else {
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
/**
 * @route   POST /examineCode
 * @desc    فحص كود الطلب وتحديث حالة الطلب والمعاملات المالية
 * @access  Private
 */
router.post("/examineCode", auth, async (req, res) => {
  try {
    // التحقق من وجود معرف الطلب
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "يجب توفير معرف الطلب"
      });
    }

    // البحث عن الطلب في قاعدة البيانات
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود"
      });
    }

    // التحقق من حالة الطلب الحالية لتجنب التحديثات المتكررة
    if (order.status === "onWay") {
      return res.status(400).json({
        success: false,
        message: "تم تحديث حالة الطلب مسبقًا"
      });
    }

    // التحقق من وجود معلومات المتجر والسائق
    if (!order.store || !order.store.id || !order.driver || !order.driver.id) {
      return res.status(400).json({
        success: false,
        message: "معلومات المتجر أو السائق غير مكتملة"
      });
    }

    // بدء معاملة قاعدة البيانات
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // تحديث حالة الطلب
      order.status = "onWay";
      order.type = "onWay";
      await order.save({ session });

      // تحديث رصيد المتجر
      const store = await Store.findById(order.store.id).session(session);
      if (!store) {
        throw new Error("المتجر غير موجود");
      }

      // إضافة المبلغ إلى رصيد المتجر
      store.funds = store.funds || 0;
      store.funds += order.totalPrice;
      await store.save({ session });

      // تحديث رصيد السائق
      const driver = await Driver.findById(order.driver.id).session(session);
      if (!driver) {
        throw new Error("السائق غير موجود");
      }



      // إنشاء سجل معاملة جديد


      // تأكيد المعاملة
      await session.commitTransaction();
      session.endSession();

      // إرسال استجابة نجاح
      return res.status(200).json({
        success: true,
        message: "تمت العملية بنجاح",
        data: {
          orderId: order.orderId,
          status: order.status,
          transactionId: transaction._id
        }
      });
    } catch (error) {
      // إلغاء المعاملة في حالة حدوث خطأ
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error(`خطأ في فحص كود الطلب: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message
    });
  }
});
router.post("/confirmOrder", auth, async (req, res) => {
  const { orderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(orderId))
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });

  const session = await mongoose.startSession();
  try {
    let order, driver, user;

    await session.withTransaction(async () => {
      /* 1) جلب الطلب والسائق والعميل */
      order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("الطلب غير موجود");

      driver = await Driver.findById(order.driver.id).session(session);
      if (!driver) throw new Error("السائق غير موجود");

      user = await User.findById(order.customer.id).session(session);
      if (!user) throw new Error("المستخدم غير موجود");

      // تأكد أن السائق نفسه هو من يؤكد الطلب
      if (!order.driver.id == req.user._id)
        throw new Error("صلاحيات غير كافية");

      /* 2) تحديث رصيد السائق */
      const incObj = {
        funds: order.companyFee,
        balance: order.distenationPrice - order.companyFee
      };
      if (order.handcheck) incObj.funds += order.totalPrice;

      await Driver.updateOne(
        { _id: driver._id },
        { $inc: incObj },
        { session }
      );

      /* 3) إنشاء سجل التأكيد */
      await OrderRecord.create(
        [{
          ...order.toObject(),
          status: "confirmed",
          type: "confirmed",
          canceledBy: null,
          confirmedAt: new Date()
        }],
        { session }
      );

      /* 4) حذف الطلب وتحديث قائمة الطلبات عند المستخدم */
      await Promise.all([
        Order.deleteOne({ _id: orderId }).session(session),
        User.updateOne(
          { _id: user._id },
          { $pull: { orders: order._id } }
        ).session(session)
      ]);
    });

    /* --- إشعارات خارج الـ transaction --- */
    await Promise.all([
      sendNotification({
        token: user.fcmToken,
        title: `تم تسليم طلبك رقم ${order.orderId}`,
        body: "نتمنى أن الخدمة قد نالت رضاكم 🙏"
      }),
      notification.create({
        id: user._id,
        userType: "user",
        title: `تم تسليم طلبك رقم ${order.orderId}`,
        body: "نتمنى أن الخدمة قد نالت رضاكم 🙏",
        type: "success"
      })
    ]);

    res.json({
      error: false,
      message: "تم تأكيد الطلب بنجاح",
      data: { orderId: order.orderId }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  } finally {
    session.endSession();
  }
});


router.post("/cancelOrderUser", auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    let orderObj = await Order.findById(orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ error: true, message: "معرّف غير صالح" });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        /* 1) جلب المستندات - بالتتالي */
        const user = await User.findById(req.userId).session(session);
        const order = await Order.findById(orderId).session(session);
        const admin = await Admin.findById("67ab9be0c878f7ab0bec38f5").session(session);

        if (!order) throw new Error("الطلب غير موجود");
        if (!order.customer.id.equals(req.userId)) throw new Error("صلاحيات غير كافية");
        if (!["waiting"].includes(order.status))
          throw new Error("لا يمكن إلغاء هذا الطلب حاليًا");

        /* 2) إنشاء سجل الإلغاء */
        await OrderRecord.create(
          [{
            ...order.toObject(),
            status: "canceled",
            type: "canceled",
            canceledBy: "user",
            canceledAt: new Date(),
          }],
          { session }
        );

        /* 3) حذف الطلب */
        await Order.deleteOne({ _id: orderId }).session(session);

        /* 4) تحديث المستخدم */
        await User.updateOne(
          { _id: req.userId },
          {
            $inc: { cancelOrderLimit: 1 },
            $pull: { orders: order._id },
            ...(user.cancelOrderLimit + 1 >= 5 && { status: "blocked" }),
          }
        ).session(session);
      });

      const admin = await Admin.findById("67ab9be0c878f7ab0bec38f5");
      const store = await Store.findById(orderObj.store.id);

      const driver = orderObj.driver
        ? await Driver.findById(orderObj.driver.id)
        : null;
      // إشعارات بعد نجاح المعاملة
      await Promise.all([
        sendNotification({
          token: admin.fcmToken,
          title: "تم الغاء الطلب رقم" + orderObj.orderId,
          body: ` قام زبون ما بالغاء طلبية من متجر ${orderObj.store.name}`,
        }),
        sendNotificationToTopic({
          topic: "admins_" + req.headers.cityen,
          title: "تم الغاء الطلب رقم" + orderObj.orderId,
          body: ` قام زبون ما بالغاء طلبية من متجر ${orderObj.store.name}`,
        }),
        sendNotification({
          /* إلى المتجر */ token: store.fcmToken,
          title: "تم الغاء الطلب رقم" + orderObj.orderId,
          body: "",
        }),
        orderObj.driver &&
        sendNotification({
            /* إلى السائق */ token: driver.fcmToken,
          title: "تم الغاء الطلب رقم" + orderObj.orderId,
          body: "",
        }),
      ]);

      const user = await User.findById(req.user._id); // جلب السقف بعد التحديث
      res.json({
        error: false,
        data: {
          message: "تم إلغاء الطلب بنجاح",
          remainingCancels: Math.max(0, 5 - user.cancelOrderLimit),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: err.message });

    } finally {
      session.endSession();
    }
  } catch (error) {
    console.log("2", error)
  }

});

router.post("/cancelOrderStore", auth, async (req, res) => {
  const { orderId, reason = "", unavailableProducts = [] } = req.body;
  let orderObj = await Order.findById(orderId);

  if (!mongoose.Types.ObjectId.isValid(orderId))
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("الطلب غير موجود");

      // التحقق من ملكية المتجر
      if (order.store.id !== req.user._id && req.user.userType != "Admin")
        throw new Error("صلاحيات غير كافية");

      await OrderRecord.create(
        [
          {
            ...order.toObject(),
            status: "canceled",
            canceledAt: new Date(),
            canceledBy: "store",
          },
        ],
        { session }
      );
      await Order.deleteOne({ _id: orderId }).session(session);
      await User.updateOne(
        { _id: order.customer.id },
        { $pull: { orders: order._id } }
      ).session(session);

      // إشعارات
      await notifyStakeholders({ order, reason, unavailableProducts });
    });

    res.json({ error: false, message: "تم إلغاء الطلب بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  } finally {
    session.endSession();
  }
});
router.post("/cancelOrderDriver", auth, async (req, res) => {
  const { orderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(orderId))
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });
  let orderObj = await Order.findById(orderId);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const driverId = req.user._id;

      /* 1) جلب المستندات */
      const driver = await Driver.findById(driverId).session(session);
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("الطلب غير موجود");
      if (order.driver.id != driverId)
        throw new Error("صلاحيات غير كافية");

      /* 2) منطق الإلغاء أو الإرجاع */
      if (order.status === "onWay") {
        // سجل الإلغاء
        await OrderRecord.create([{
          ...order.toObject(),
          status: "canceled",
          type: "canceled",
          canceledBy: "driver",
          canceledAt: new Date(),
        }], { session });

        // حذف الطلب
        await Order.deleteOne({ _id: orderId }).session(session);

        // حد الإلغاء للسائق
        await Driver.updateOne(
          { _id: driverId },
          {
            $inc: { cancelOrderLimit: 1 },
            ...(driver.cancelOrderLimit + 1 >= 5 && { status: "blocked" }),
          }
        ).session(session);

        // إزالة الطلب من قائمة المستخدم
        await User.updateOne(
          { _id: order.customer.id },
          { $pull: { orders: order._id } }
        ).session(session);

      } else if (["accepted", "waiting"].includes(order.status)) {
        // فقط إرجاعه إلى المتجر
        order.set({ status: "ready", type: "ready", driver: null });
        await order.save({ session });
      } else {
        throw new Error("لا يمكن إلغاء هذا الطلب حاليًا");
      }
    });

    /* --- إشعارات بعد نجاح المعاملة --- */
    const [admin, user, store, driver] = await Promise.all([
      Admin.findOne({ phone: "0910808060" }),
      User.findById(orderObj.customer.id),
      Store.findById(orderObj.store.id || undefined), // أو order.store
      Driver.findById(req.user._id),
    ]);

    const notifications = [
      sendNotification({
        token: admin.fcmToken,
        title: `تم إلغاء الطلب رقم ${orderObj.orderId}`,
        body: "قام سائق بإلغاء الطلب.",
      }),
      sendNotification({
        token: user.fcmToken,
        title: `عذراً! تم إلغاء طلبيتك رقم ${orderObj.orderId}`,
        body: "قام السائق بإلغاء الطلب، يُرجى إعادة الطلب.",
      }),
      sendNotification({
        token: store.fcmToken,
        title: `إلغاء من السائق للطلب رقم ${orderObj.orderId}`,
        body: "السائق ألغى الطلب، الطلب متاح لسائق آخر.",
      }),
      sendNotification({
        token: driver.fcmToken,
        title: `تم إلغاء الطلبية`,
        body: `لقد ألغيت الطلبية رقم ${orderObj.orderId}`,
      }),
      sendNotificationToTopic({
        topic: `admins_${req.headers.cityen}`,
        title: `تم إلغاء الطلب رقم ${orderId}`,
        body: "قام سائق ما بإلغاء الطلب.",
      }),
    ];

    await Promise.all(notifications.filter(Boolean));

    /* جلب السائق مجددًا لمعرفة عداد الإلغاء */
    const driverAfter = await Driver.findById(req.user._id);

    res.json({
      error: false,
      data: {
        message: "تم إلغاء الطلب بنجاح",
        remainingCancels: Math.max(0, 5 - driverAfter.cancelOrderLimit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  } finally {
    session.endSession();
  }
});


module.exports = router;
