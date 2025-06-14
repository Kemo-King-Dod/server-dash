const { Server } = require("socket.io");
const Store = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver");
const Order = require("../database/orders");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const Admin = require("../database/admin");
const { Mongoose, default: mongoose } = require("mongoose");

let isconnected;

function createserver(server) {
  return new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
}

async function connect(socket) {
  try {
    /* ------------------------------------------------------------------ *
     * 1) استخراج الـ JWT والتحقُّق منه                                    *
     * ------------------------------------------------------------------ */
    const token = socket.handshake.headers.authorization;
    if (!token) {
      console.log("🚫 لا يوجد JWT في الهيدر");
      return;                               // نخرج مبكرًا إذا لم يوجد توكن
    }
  
    // التحقق من صحة التوكن وإرجاع الـ payload
    const { id } = jwt.verify(
      token,
      "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman"
    );
  
    /* ------------------------------------------------------------------ *
     * 2) تعريف الكيانات المراد البحث فيها بالترتيب + الغرفة (إن وُجدت)     *
     * ------------------------------------------------------------------ */
    const entities = [
      { model: User,   room: null },        // مستخدم عادي
      { model: Admin,  room: "admins" },    // أدمن
      { model: Store,  room: null },        // متجر
      { model: Driver, room: "drivers" },   // سائق
    ];
  
    /* ------------------------------------------------------------------ *
     * 3) الحلقة: نحاول إيجاد الـ id في كل كيان بالترتيب                   *
     * ------------------------------------------------------------------ */
    for (const { model, room } of entities) {
      const doc = await model.findById(id);
      if (!doc) continue;                   // جرّب الكيان التالي إذا لم يوجد
  
      // تحديث حالة الاتصال في قاعدة البيانات
      await model.updateOne(
        { _id: id },
        { $set: { connection: true, connectionId: socket.id } }
      );
  
      // الانضمام إلى الغرفة المناسبة (إن وُجدت)
      if (room) socket.join(room);
  
      console.log(`✅ ${model.modelName} متصل: ${socket.id}`);
                             // تَوَقَّف فور العثور على الكيان
    }
  
    /* ------------------------------------------------------------------ *
     * 4) إذا لم يُعثر على المستخدم في أي كيان                             *
     * ------------------------------------------------------------------ */
    console.log("❌ Access denied – غير موجود في أي مجموعة");
  } catch (err) {
    console.log("⚠️ خطأ في المصادقة:", err.message);
  }
  
  console.log("hello")
 /* ------------------------------------------------------------------ *
 *    Helpers                                                          *
 * ------------------------------------------------------------------ */

const RETRY_DELAY   = 5_000;   // 5 ثوانٍ
const MAX_RETRIES   = 180;     // 15 دقيقة كحدّ أقصى

/**
 * ابعث الحدث إلى الهدف إذا كان متصلاً، أو انتظر لحين اتصاله ثم ابعثه.
 *
 * @param {Socket} socket      – سوكِت المُرسِل
 * @param {Model}  Model       – Mongoose model (User / Admin / Store / Driver)
 * @param {Object} query       – شرط البحث (phone أو _id …)
 * @param {String} eventName   – اسم الحدث: "updateAdmin" مثلاً
 * @param {Any}    payload     – البيانات المُرسَلة
 */
async function sendWhenConnected(socket, Model, query, eventName, payload) {
  let target = await Model.findOne(query);
  console.log("target is ",target);

  // 1) متصل بالفعل ➜ نرسل فورًا
  if (target?.connection) {
    console.log("target",target);
    return socket.to(target.connectionId).emit(eventName, payload);
  }

  // 2) غير متصل ➜ نعيد المحاولة
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts++;
    target = await Model.findOne(query);

    if (target?.connection || attempts >= MAX_RETRIES) {
      if (target?.connection) {
        socket.to(target.connectionId).emit(eventName, payload);
      }
      clearInterval(timer);            // أوقف التايمر أياً كانت النتيجة
    }
  }, RETRY_DELAY);
}

/* ------------------------------------------------------------------ *
 *    Listeners                                                        *
 * ------------------------------------------------------------------ */

socket.on("updateAdmin", async (data) => {
  // 1) رسالة دردشة ➜ نستعمل phone من data.id
  if (data.type === "chat") {
    return sendWhenConnected(socket, Admin, { phone: data.id }, "updateAdmin", data);
  }

  // 2) أي تحديث آخر ➜ نرسل للـ Super-Admin برقم هاتفه الثابت
  await sendWhenConnected(socket, Admin, { phone: "0910808060" }, "updateAdmin", data);
});

socket.on("updateUser", async (data) => {
  // 1) دردشة ➜ lookup بالهاتف
  if (data.type === "chat") {
    return sendWhenConnected(socket, User, { phone: data.id }, "updateUser", data);
  }

  // 2) غير دردشة ➜ lookup بالـ ObjectId
  await sendWhenConnected(
    socket,
    User,
    { _id: new mongoose.Types.ObjectId(data.userID) },
    "updateUser",
    data
  );
});

socket.on("updateStore", async (data) => {
  // 1) أرسل التحديث إلى المتجر
  await sendWhenConnected(
    socket,
    Store,
    { _id: new mongoose.Types.ObjectId(data.storeID) },
    "updateStore",
    data
  );

  // 2) Mirror إلى الـ Admin الرئيسي
  await sendWhenConnected(socket, Admin, { phone: "0910808060" }, "updateAdmin", data);
});

socket.on("updateDriver", async (data) => {
  // 1) دردشة مع سائق واحد
  if (data.type === "chat") {
    return sendWhenConnected(socket, Driver, { phone: data.id }, "updateDriver", data);
  }
  if(data.type == "cancelOrder"){
    console.log("cancel order socket ", data);
    return sendWhenConnected(socket, Driver, { phone: data.phone }, "updateDriver", data);

  }

  // 2) بثّ إلى جميع السائقين المتواجدين في غرفة "drivers"
  socket.to("drivers").emit("updateDriver", data);
});

/* ------------------------------------------------------------------ *
 *    باقي الأحداث البسيطة                                             *
 * ------------------------------------------------------------------ */

socket.on("joinRoom", (room)  => socket.join(room));
socket.on("leaveRoom", (room) => socket.leave(room));

socket.on("disconnect", async () => {
  // إلغاء connection لأي نموذج يحوي الـ socket.id
  const models = [User, Store, Driver];
  for (const Model of models) {
    const doc = await Model.findOne({ connectionId: socket.id });
    if (doc) {
      await Model.updateOne(
        { _id: doc._id },
        { $set: { connection: false, connectionId: null } }
      );
      break;
    }
  }
});

  // Initialize connection timeout check
  // isuserconnected(socket);
}

// function isuserconnected(socket) {
//   isconnected = setTimeout(async () => {
//     try {
//       let exist = await Store.findOne({ connectionId: socket.id });
//       if (!exist) {
//         exist = await User.findOne({ connectionId: socket.id });
//         if (!exist) {
//           exist = await Driver.findOne({ connectionId: socket.id });
//           if (!exist) {
//             return;
//           }
//           // Fixed: Added missing driver timeout handling
//           await Driver.updateOne(
//             { connectionId: socket.id },
//             { $set: { connection: false, connectionId: null } }
//           );
//         } else {
//           await User.updateOne(
//             { connectionId: socket.id },
//             { $set: { connection: false, connectionId: null } }
//           );
//         }
//       } else {
//         await Store.updateOne(
//           { connectionId: socket.id },
//           { $set: { connection: false, connectionId: null } }
//         );
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   }, 1000 * 20);
// }

// function userisstillconnected(socket) {
//   clearTimeout(isconnected);
//   isconnected = false;
//   isuserconnected(socket);
// }

module.exports = { createserver, connect };
