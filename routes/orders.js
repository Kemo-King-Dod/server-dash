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
const adminsList = require("../utils/admins.json").users;

let ordersNum;
const admins = [
  "682e92122f76a6aadd90d682",
  "67f7abaffd2b01381a293aa8",
  "6861689248ad8925d7252301",
  "67ba19266f9f68ff76b96cb7",
  "67f22942f90165d57806ecd3",
  "686168b148ad8925d7252302",
  "686168d048ad8925d7252303",
];

// ***********************
async function read() {
  try {
    const result = await Info.findOneAndUpdate(
      {}, // لا شرط لأنك تضمن وجود وثيقة واحدة فقط
      { $inc: { orders_number: 1 } }, // زيادة orders_number بمقدار 1
      {
        returnOriginal: false, // إرجاع الوثيقة بعد التحديث (لـ Mongoose)
        upsert: true, // إنشاء الوثيقة إذا لم تكن موجودة (اختياري)
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
   var Orders ;
    var compOrders 
  if(req.user.city == "All"){
   Orders = await orders.find({});
  compOrders = await OrderRecord.find({})
  }
  else{
     Orders = await orders.find({city:req.user.city});
     compOrders = await OrderRecord.find({city:req.user.city})
  }
  
  return res.status(200).json({
    error: false,
    data: {
      orders: [...Orders,...compOrders],
    },
  });
});

// orders [add , delete , change state]
router.post("/addOrder", auth, async (req, res) => {
  try {
    try {
      if (!Array.isArray(adminsList) || (!adminsList.includes(req.user._id.toString()))) {
        return res.status(503).json({
          error: true,
          message: "🚧 التطبيق قيد الصيانة المؤقتة 🚧\nنقوم حاليًا بتحديث النظام وتحسين الأداء لتجربة أفضل.\nنعتذر عن الإزعاج، ونتطلع لعودتكم قريبًا في إطلالة فاستو الجديدة ✨",
        });
      }
    } catch (err) {
      console.error("Failed to load admins.json:", err);
      return res.status(500).json({
        error: true,
        message: "خطأ داخلي في الخادم", 
      });
    }
    
    // console.log(req.body)
    const itemsdata = [];
    const userId = req.userId;
    const StoreId = req.body.storeId;
    


       const theAddress =req.body.addressId == 'current_location'?req.body.address: await Address.findById(req.body.addressId);
    
   
    const store = await Store.findById(StoreId);
    const admin = await Admin.findOne({ phone: "0910808060" });
    const user = await User.findById(userId);
    const deliveryPrice = req.body.deliveryPrice;
    let totalprice = 0;
    let activeOrderCount = await Order.countDocuments({
      "customer.id": new mongoose.Types.ObjectId(req.userId),
      status: {
        $in: ["waiting", "accepted", "ready", "driverAccepted", "onWay"],
      },
    });
    

    if (activeOrderCount >= 3 && !admins.includes(req.userId)) {
      return res.status(500).json({
        error: true,
        message:
          "لديك 3 طلبيات جارية بالفعل الرجاء الانتظار الى حين انتهاء احد الطلبيات",
      });
    }
    // Check for blocked status based on cancelOrderLimit
    if (user.cancelOrderLimit >= 5) {
      return res.status(500).json({
        error: true,
        message: "تم حظر حسابك بسبب كثرة إلغاء الطلبات",
      });
    }
    if (store.city != getCityName(theAddress).englishName) {
      return res.status(500).json({
        error: true,
        message: "المحل غير موجود في هذه المدينة",
      });
    }
    for (var i = 0; i < user.cart.length; i++) {
      if (user.cart[i].cartItem.storeID == StoreId) {
        const item = await Item.findById(user.cart[i].cartItem.id);
       
        const quantity = user.cart[i].cartItem.quantity; 
       console.log ("item.price: ", item.price*quantity);
       console.log("price: ", user.cart[i].cartItem.price*quantity);
       
       
        itemsdata.push({
          id: item._id,
          name: item.name,
          image: item.imageUrl,
          options: user.cart[i].cartItem.options,  
          addOns: user.cart[i].cartItem.addOns, 
          quantity: user.cart[i].cartItem.quantity, // update later
          price: item.price,
        });
        totalprice += item.price*user.cart[i].cartItem.quantity;
      } 
    }

    if (itemsdata.length == 0) {
      res.status( 500).json({
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
        isModfiy: store.isModfiy,
        modfingPrice: store.modfingPrice,
      },
      driver: null,
      companyFee: store.isModfiy ? 0 : store.companyFee,
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
      billingType: req.body.billingType
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
    const theorderId = order.toObject();
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
        isAdmin:true
      });
    } catch (e) {
      console.log("الادمن لم يستلم الاشعار");
    }
    try {
      sendNotificationToTopic({
        topic: "admins",
        title: "طلبية جديدة",
        body: ` قام زبون ما بطلب طلبية من متجر ${store.name}`,
        isAdmin:true
      });
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
    console.log(order);
    console.log("city.englishName", req.headers.cityen);
    console.log("status", "ready");
    console.log("acceptedorders", acceptedorders);
    

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

    if (
      req.user.userType !== "admin" &&
      acceptedordersCount >= 3 &&
      !admins.includes(req.userId)
    ) {
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
    console.log(req.body);
    // التحقق من وجود معرف الطلب
    const { orderId } = req.body;
    if (!orderId) {
      console.log("not id");

      return res.status(400).json({
        error: true,
        message: "يجب توفير معرف الطلب",
      });
    }

    // البحث عن الطلب في قاعدة البيانات
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("not order");
      return res.status(404).json({
        error: true,
        message: "الطلب غير موجود",
      });
    }

    // التحقق من حالة الطلب الحالية لتجنب التحديثات المتكررة
    if (order.status === "onWay") {
      console.log("not on way");
      return res.status(400).json({
        error: true,
        message: "تم تحديث حالة الطلب مسبقًا",
      });
    }

    // التحقق من وجود معلومات المتجر والسائق
    if (!order.store || !order.store.id || !order.driver || !order.driver.id) {
      console.log(order);
      return res.status(400).json({
        error: true,
        message: "معلومات المتجر أو السائق غير مكتملة",
      });
    }
    try {
      // Update order status
      order.status = "onWay";
      order.type = "onWay";
      await order.save();

      // Update store balance
      const store = await Store.findById(order.store.id);
      if (!store) {
        throw new Error("المتجر غير موجود");
      }

      // Add amount to store funds
      store.funds = store.funds || 0;
      store.funds += order.totalPrice;
      await store.save();

      // Update driver record
      const driver = await Driver.findById(order.driver.id);
      if (!driver) {
        throw new Error("السائق غير موجود");
      }

      // Send success response
      return res.status(200).json({
        error: false,
        message: "تمت العملية بنجاح",
        data: {
          orderId: order.orderId,
          status: order.status,
        },
      });
    } catch (err) {
      console.error(`خطأ في فحص كود الطلب: ${err.message}`);
      return res.status(500).json({
        error: false,
        message: "حدث خطأ أثناء معالجة الطلب",
        error: err.message,
      });
    }
  } catch (err) {
    console.error(`خطأ في فحص كود الطلب: ${err.message}`);
    return res.status(500).json({
      error: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message,
    });
  }
});
router.post("/confirmOrder", auth, async (req, res) => {
  const { orderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(orderId))
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });

  try {
    /* جلب المستندات */
    var order = await Order.findById(orderId);
    if (!order) throw new Error("الطلب غير موجود");
    order.city = order.city.englishName;
    if (String(order.driver.id) !== String(req.user._id))
      throw new Error("صلاحيات غير كافية");

    const driver = await Driver.findById(order.driver.id);
    const user = await User.findById(order.customer.id);
    if (!driver || !user) throw new Error("السائق أو المستخدم غير موجود");

    /* تحديثات مستقلة */
    const incObj = {
      funds: order.companyFee + (order.handcheck ? order.totalPrice : 0),
      balance: order.distenationPrice - order.companyFee,
    };

    await Driver.updateOne(
      { _id: driver._id },
      { $inc: incObj },
      { runValidators: false }
    );

    await OrderRecord.create({
      ...order.toObject(),
      status: "confirmed",
      type: "confirmed",
      canceledBy: null,
      confirmedAt: new Date(),
    });

    await Promise.all([
      Order.deleteOne({ _id: orderId }),
      User.updateOne(
        { _id: user._id },
        { $pull: { orders: order._id } },
        { runValidators: false }
      ),
    ]);

    /* إشعارات */
    await Promise.all([
      sendNotification({
        token: user.fcmToken,
        title: `تم تسليم طلبك رقم ${order.orderId}`,
        body: "نتمنى أن الخدمة قد نالت رضاكم 🙏",
      }),
      notification.create({
        id: user._id,
        userType: "user",
        title: `تم تسليم طلبك رقم ${order.orderId}`,
        body: "نتمنى أن الخدمة قد نالت رضاكم 🙏",
        type: "success",
      }),
    ]);

    res.json({
      error: false,
      message: "تم تأكيد الطلب بنجاح",
      data: { orderId: order.orderId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});

router.post("/cancelOrderUser", auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: true, message: "معرّف غير صالح" });
    }

    /* 1) Get documents */
    const user = await User.findById(req.userId);
    var order = await Order.findById(orderId);
    order.city = order.city.englishName;
    if (!order) throw new Error("الطلب غير موجود");
    if (!order.customer.id.equals(req.userId))
      throw new Error("صلاحيات غير كافية");
    if (!["waiting"].includes(order.status))
      throw new Error("لا يمكن إلغاء هذا الطلب حاليًا");

    /* 2) Create cancellation record */
    await OrderRecord.create({
      ...order.toObject(),
      status: "canceled",
      type: "canceled",
      canceledBy: "user",
      canceledAt: new Date(),
    });

    /* 3) Delete order */
    await Order.deleteOne({ _id: orderId });

    /* 4) Update user */
    await User.updateOne(
      { _id: req.userId },
      {
        $inc: { cancelOrderLimit: 1 },
        $pull: { orders: order._id },
        ...(user.cancelOrderLimit + 1 >= 5 && { status: "blocked" }),
      },
      { runValidators: false }
    );

    /* 5) Send notifications */
    const admin = await Admin.findById("67ab9be0c878f7ab0bec38f5");
    const store = await Store.findById(order.store.id);
    const driver = order.driver
        ? await Driver.findById(order.driver.id)
      : null;

    await Promise.all([
      sendNotification({
        token: admin.fcmToken,
        title: "تم الغاء الطلب رقم" + order.orderId,
        body: ` قام زبون ما بالغاء طلبية من متجر ${order.store.name}`,
      }),
      sendNotificationToTopic({
        topic: "admins_" + req.headers.cityen,
        title: "تم الغاء الطلب رقم" + order.orderId,
        body: ` قام زبون ما بالغاء طلبية من متجر ${order.store.name}`,
      }),
      sendNotification({
        token: store.fcmToken,
        title: "تم الغاء الطلب رقم" + order.orderId,
        body: "",
      }),
      order.driver &&
        sendNotification({
          token: driver.fcmToken,
          title: "تم الغاء الطلب رقم" + order.orderId,
          body: "",
        }),
    ]);

    const updatedUser = await User.findById(req.user._id);
    res.json({
      error: false,
      data: {
        message: "تم إلغاء الطلب بنجاح",
        remainingCancels: Math.max(0, 5 - updatedUser.cancelOrderLimit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});
router.post("/cancelOrderStore", auth, async (req, res) => {
  const { orderId, reason = "", unavailableProducts = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });
  }

  try {
    var order = await Order.findById(orderId);
    if (!order) throw new Error("الطلب غير موجود");

    // التحقق من ملكية المتجر
    if (
      order.store.id.toString() !== req.userId &&
      req.user.userType != "Admin"
    ) {
    

      throw new Error("صلاحيات غير كافية");
    }
   order.city = order.city.englishName;
    // Create order record
    await OrderRecord.create({
      ...order.toObject(),
      status: "canceled",
      canceledAt: new Date(),
      canceledBy: "store",
    });

    // Delete order and update user
    await Promise.all([
      Order.deleteOne({ _id: orderId }),
      User.updateOne(
        { _id: order.customer.id },
        { $pull: { orders: order._id } },
        { runValidators: false }
      ),
    ]);

    // Send notifications
    await notifyStakeholders({ order, reason, unavailableProducts });

    res.json({ error: false, message: "تم إلغاء الطلب بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});
router.post("/cancelOrderDriver", auth, async (req, res) => {
  const { orderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(orderId))
    return res.status(400).json({ error: true, message: "معرّف غير صالح" });

  try {
    const driverId = req.user._id;

    /* 1) جلب المستندات */
    const driver = await Driver.findById(driverId);
    var order = await Order.findById(orderId);
    if (!order) throw new Error("الطلب غير موجود");
    if (order.driver.id != driverId) throw new Error("صلاحيات غير كافية");

    let orderObj = order;
    orderObj.city = orderObj.city.englishName;

    /* 2) منطق الإلغاء أو الإرجاع */
    if (order.status === "onWay") {
      // سجل الإلغاء
      await OrderRecord.create({
        ...orderObj.toObject(),
        status: "canceled",
        type: "canceled",
        canceledBy: "driver",
        canceledAt: new Date(),
      });

      // حذف الطلب
      await Order.deleteOne({ _id: orderId });

      // حد الإلغاء للسائق
      await Driver.updateOne(
        { _id: driverId },
        {
          $inc: { cancelOrderLimit: 1 },
          ...(driver.cancelOrderLimit + 1 >= 5 && { status: "blocked" }),
        }
      );

      // إزالة الطلب من قائمة المستخدم
      await User.updateOne(
        { _id: order.customer.id },
        { $pull: { orders: order._id } },
        { runValidators: false }
      );
    } else if (["accepted", "waiting"].includes(order.status)) {
      // فقط إرجاعه إلى المتجر
      order.status = "ready";
      order.type = "ready";
      order.driver = null;
      await order.save();
    } else {
      throw new Error("لا يمكن إلغاء هذا الطلب حاليًا");
    }

    /* --- إشعارات بعد نجاح المعاملة --- */
    const [admin, user, store, driverto] = await Promise.all([
      Admin.findOne({ phone: "0910808060" }),
      User.findById(orderObj.customer.id),
      Store.findById(orderObj.store.id || undefined),
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
        token: driverto.fcmToken,
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
  }
});

module.exports = router;
router.post("/updateOrder", auth, async (req, res) => {
  try {
    const {
      orderId,
      status,
      type,
      totalPrice,
      distenationPrice,
      companyFee,
      items,
      address,
      chat,
      driver,
      store,
      customer
    } = req.body;

    // Check if user is admin
    if (!admins.includes(req.userId) && req.user.userType !== "Admin") {
      return res.status(403).json({
        error: true,
        operation: "updateOrder",
        message: "ليس لديك صلاحية لتعديل الطلبات - المسؤولون فقط",
      });
    }

    // Find the order first
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: true,
        operation: "updateOrder",
        message: "الطلب غير موجود",
      });
    }

    // Prepare update object with only provided fields
    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
    if (distenationPrice !== undefined) updateData.distenationPrice = distenationPrice;
    if (companyFee !== undefined) updateData.companyFee = companyFee;
    if (items !== undefined) updateData.items = items;
    if (address !== undefined) updateData.address = address;
    if (chat !== undefined) updateData.chat = chat;
    if (driver !== undefined) updateData.driver = driver;
    if (store !== undefined) updateData.store = store;
    if (customer !== undefined) updateData.customer = customer;

    // Update the order
    await Order.findByIdAndUpdate(orderId, {
      $set: updateData
    });

    // Get updated order
    const updatedOrder = await Order.findById(orderId);

    res.status(200).json({
      error: false,
      operation: "updateOrder",
      message: "تم تحديث الطلب بنجاح",
      data: updatedOrder
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      operation: "updateOrder",
      message: error.message,
    });
  }
});