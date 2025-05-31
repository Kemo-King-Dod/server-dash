const express = require("express");
const app = express();
const fireAdmin = require("./firebase/firebase_admin.js")
const path = require("path");
const { sendNotification, sendNotificationToTopic } = require("./firebase/notification.js")
// database
const { createserver, connect } = require("./connention/socketio.js");
const connecting = require("./database/database.js");
connecting();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const expressserver = app.listen(4000, () => {
  console.log("server is listening on port 4000");
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
app.use(ads)

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
