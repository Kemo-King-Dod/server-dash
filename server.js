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
app.use(ads)


// ...existing code...

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
        userId: user._id,
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
 


   
 

  
  

 
 
 
// addIsModifyAndModfingPriceToAllStores();
// async function addIsModifyAndModfingPriceToAllStores() {
//   try {
//       await Store.updateMany(
//           {},
//           {
//               $set: {
//                   isModfiy: false,
//                   modfingPrice: 0.0
//               }
//           }
//       );
//       console.log('تم تحديث جميع المتاجر بنجاح');
//   } catch (err) {
//       console.error('حدث خطأ أثناء التحديث:', err);
//   }
// }


// sendNotification({token:"fdpKPZE7THW8ezJMF5ohkW:APA91bE96fqDdDBef5KOfknWGs-WgERfmu-uVyWRp8vAs9hDqNwHaELG42utZ2yCbhPi319vg0FLHSXFhj_b7is8-CfY6dHlloozbLxoobq3oMhunqUUV2Y",title:"تجربة", body:"اول رسالة"})
// دالة لتحديث جميع المستخدمين
// async function addFieldsToAllUsers() {
//     try {
//         // تحديث جميع المستخدمين بإضافة الحقول إذا لم تكن موجودة
//         const result = await product.updateMany(
//             {}, // بدون شرط: يشمل كل المستخدمين
//             {
//                 $set: {
//                   city : 
//                     // يمكنك استخدام new Date(0) إذا أردت قيمة وقت صفرية
//                 }
//             }
//         );

//         console.log(`تم تحديث ${result.modifiedCount} مستخدمًا.`);
//     } catch (err) {
//         console.error("خطأ أثناء التحديث:", err);
//     }
// }
