const express = require("express");
const app = express();
const fireAdmin = require("./firebase/firebase_admin.js")
const path = require("path");
const { sendNotification, sendNotificationToTopic } = require("./firebase/notification.js")
require("dotenv").config(); // CommonJS

// database
const { createserver, connect } = require("./connention/socketio.js");
const connecting = require("./database/database.js");
connecting(); 

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
 const PORT = process.env.PORT || 3500;
const expressserver = app.listen(PORT, () => {
  console.log(`server is listening on  ${PORT}`);
});

const io = createserver(expressserver);
io.on("connection", connect);

const loadphoto = require("./routes/loadPhoto.js");
app.use(loadphoto);

const signup = require("./routes/signUp.js");
app.use(signup);

const login = require("./routes/login.js");
app.use(login);

const cart = require("./routes/cart.js");
app.use(cart);

const favorite = require("./routes/favorite.js");
app.use(favorite);

const follow = require("./routes/follow.js");
app.use(follow);

const admin = require("./routes/admin.js");
app.use(admin);

const items = require("./routes/Items.js");
app.use(items);

const store = require("./routes/store.js");
app.use(store);

const user = require("./routes/user.js");
app.use(user);

const driver = require("./routes/driver.js");
app.use(driver);

const orders = require("./routes/orders.js");
app.use(orders);

const orderRecord = require("./routes/orderRecord.js");
app.use(orderRecord);

const categiries = require("./routes/getcategiries.js");
app.use(categiries);

const wallet = require("./routes/wallet.js");
app.use(wallet);

const likes = require("./routes/likes.js");
app.use(likes);

const retrenchments = require("./routes/retrenchments.js");
app.use(retrenchments);

const search = require("./routes/search.js");
app.use(search);

const chat = require("./routes/chat.js");
app.use(chat);

const storeSettings = require("./routes/storeSettings.js");
app.use(storeSettings);

const controlPanel = require("./routes/controlPanel.js");
app.use(controlPanel);

const getCity = require("./routes/getCities.js");
app.use(getCity);

const getCities = require("./utils/getCities.js");
app.use(getCities);

const notification = require("./routes/notification.js");
app.use(notification);

const version = require("./routes/version.js");
app.use(version);

const reports = require('./routes/reports.js');
const product = require('./database/items.js');
app.use(reports)

const ads= require('./routes/ads.js');
const User = require("./database/users.js");
const Notification = require("./database/notification.js");
const OrderRecord = require("./database/orders_record.js");
const getCityName = require("./utils/getCityName.js");
const Store = require("./database/store.js");
const Items = require("./database/items.js");
const Order = require("./database/orders.js");
app.use(ads)
// ✋ تشغيل مهام تعتمد على قاعدة البيانات فقط بعد إتمام الاتصال
const mongoose = require("mongoose");
mongoose.connection.once("connected", () => {
 
});

// ...existing code...
// setCitiesforOrderRecord();
async function setCitiesforOrderRecord() {
  try {
    const records = await OrderRecord.find({ city: { $exists: false } });

    for (const record of records) {
      if (record.store.location && record.store.location.latitude && record.store.location.longitude) {
        const cityName = await getCityName(record.store.location).englishName; 
        if (cityName) {
          record.city = cityName;
          await record.save();
          console.log(`Updated orderRecord ${record._id} with city: ${cityName}`);
        }
      }
    }

    console.log("Finished updating orderRecord cities.");
  } catch (err) {
    console.error("Error updating orderRecord cities:", err);
  }
}


// findCartLengthInUsers();
async function findCartLengthInUsers() {
  try {
    // جلب المستخدمين الذين لديهم عناصر في السلة
    const usersWithCart = await User.find({ cart: { $exists: true, $not: { $size: 0 } } });

    // إذا لم يوجد مستخدمون، اطبع رسالة وانتهِ
    if (usersWithCart.length === 0) {
      console.log("لا يوجد مستخدمون لديهم عناصر في السلة.");
      return;
    }

    // تفريغ السلات
    await User.updateMany(
      { cart: { $exists: true, $not: { $size: 0 } } },
      { $set: { cart: [] } }
    );

    // إرسال إشعار وكتابة بيانات كل مستخدم
    for (const user of usersWithCart) {
      console.log(`تم تفريغ سلة المستخدم: ${user._id}, الاسم: ${user.name}, رقم الجوال: ${user.phone}`);
      if (user.fcmToken) {
        await sendNotification({
          token: user.fcmToken,
          title: "تم مسح السلة",
          body: "نعتذر عن الازعاج، تم مسح السلة الخاصة بك لغرض الصيانة والتطوير"
        });
      }
      await Notification.create({
        userType: "user",
        id: user._id,
        title: "تم مسح السلة",
        body: "نعتذر عن الازعاج، تم مسح السلة الخاصة بك لغرض الصيانة والتطوير"
      });
    }

    console.log(`Successfully cleared cart for ${usersWithCart.length} users`);
  } catch (err) {
    console.error('Error clearing user carts:', err);
  }
}
  //  sendNotificationToTopic({
  //       topic: "admins",
  //       title: "طلبية جديدة",
  //       body: ` قام زبون م`,   
  //       isAdmin:true
  //    });
 

// fixNotificationsWithoutId()
//    async function fixNotificationsWithoutId() {
//   try {
//     let notfiList=["682e92122f76a6aadd90d682",
// "68385d282a4f51e332f9a669",
// "6864123a3a52e8fbfd5488c1",
// "68777f78284844835e07da25",
// "687c016c284844835e08017d",
// "687e3950284844835e080deb",
// "687f64d66f92cc2d360e7282",]
//     const notifications = await Notification.find({ id: { $exists: false },});
//       let i=0

//     for (const notif of notifications) {

//       notif.id = notfiList[i];
//       await notif.save();
//       console.log(`تم تحديث إشعار ${notif._id} بإضافة id: ${notif.userId}`);
//       i++;
//     }
//     console.log(`تم تحديث ${notifications.length} إشعارًا.`);
//   } catch (err) {
//     console.error("خطأ أثناء تحديث الإشعارات:", err);
//   }
// } 
 

  
  

 
 
 
// addIsClosedToAllStores();
// async function addIsClosedToAllStores() {
//   try {
//       await Items.updateMany(
//           {},
//           {
//               $set: {
//                 available: true, 
//               } 
//           } 
//       );  
//       console.log('تم تحديث جميع المتاجر بنجاح');
//   } catch (err) {
//       console.error('حدث خطأ أثناء التحديث:', err);
//   }
// }
       

// sendNotification({token:"e5Q5Ket3QxOAX-Kxo1_Utu:APA91bGz1X_cLq8WChAtbtnJep2hwXowQFZbX2mO7Dh3VpJK-Jhaknkz_iic3q-3QB_anvZBrqhmd61LuDUPoVyaJJISXpC--Ev424MUqX34RGR4g_6iQ7I",title:"تجربة", body:"اول رسالة"})
//updateProductsStatusFromStores();
async function updateProductsStatusFromStores() {
    try {
        // جلب جميع المنتجات
        const products = await product.find({});
        
        let updatedCount = 0;
        
        for (const prod of products) {
            // البحث عن المتجر الخاص بالمنتج
            const store = await Store.findById(prod.storeID);
            
            if (store) {
                // تحديث حالة المنتج بناءً على حالة المتجر
                prod.store_register_condition = store.registerCondition;
                await prod.save();
                updatedCount++;
                
                console.log(`تم تحديث المنتج ${prod._id} إلى حالة: ${store.registerCondition}`);
            } else {
                console.log(`لم يتم العثور على متجر للمنتج ${prod._id}`);
            }
        }
        
        console.log(`تم تحديث ${updatedCount} منتجًا بنجاح.`);
    } catch (err) {
        console.error("خطأ أثناء التحديث:", err);
    }
  

}
//updateProductsCityFromStores();
async function updateProductsCityFromStores() {
  try {
    console.log("تم تحديث مدن المنتجات بنجاح");
      // جلب جميع المنتجات
      const products = await product.find({});
      
      let updatedCount = 0;
      
      for (const prod of products) {
          // البحث عن المتجر الخاص بالمنتج
          const store = await Store.findById(prod.storeID);
          
          if (store && (store.city!=prod.city)) {
              // تحديث مدينة المنتج بناءً على مدينة المتجر
              prod.city = store.city;
              await prod.save();
              updatedCount++;
              
              console.log(`تم تحديث المنتج ${prod._id} إلى مدينة: ${store.city}`);
          } else {
              console.log(`لم يتم العثور على متجر للمنتج ${prod.name}`);
          }
      }
      
      console.log(`تم تحديث ${updatedCount} منتجًا بنجاح.`);
  } catch (err) {
      console.error("خطأ أثناء تحديث المدن:", err);
  }
}  