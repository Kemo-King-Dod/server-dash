const { Server } = require("socket.io");
const Store = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver");
const Order = require("../database/orders");
const jwt = require("jsonwebtoken");
const Admin = require("../database/admin");
const { default: mongoose } = require("mongoose");

function createserver(server) {
  return new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
}

async function connect(socket) {
  const token = socket.handshake.headers.authorization;
  const secretKey = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

  let userType = null;
  let userDoc = null;

  try {
    if (!token) {
      console.log("🚫 No authorization token provided");
      return;
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // البحث عن المستخدم في كل المجموعات
    const user = await User.findById(decoded.id);
    if (user) {
      userType = "user";
      userDoc = user;
      await User.updateOne(
        { _id: user._id },
        { $set: { connection: true, connectionId: socket.id } }
      );
    }

    const admin = !userDoc && (await Admin.findById(decoded.id));
    if (admin) {
      userType = "admin";
      userDoc = admin;
      await Admin.updateOne(
        { _id: admin._id },
        { $set: { connection: true, connectionId: socket.id } }
      );
      socket.join("admins");
    }

    const store = !userDoc && (await Store.findById(decoded.id));
    if (store) {
      userType = "store";
      userDoc = store;
      await Store.updateOne(
        { _id: store._id },
        { $set: { connection: true, connectionId: socket.id } }
      );
    }

    const driver = !userDoc && (await Driver.findById(decoded.id));
    if (driver) {
      userType = "driver";
      userDoc = driver;
      await Driver.updateOne(
        { _id: driver._id },
        { $set: { connection: true, connectionId: socket.id } }
      );
      socket.join("drivers");
      console.log(`✅ Driver ${driver.name} joined drivers room`);
    }

    if (!userDoc) {
      console.log("❌ Access denied: user not found in any collection");
      return;
    }
  } catch (error) {
    console.error("⚠️ Authentication error:", error.message);
    return;
  }

  // ✅ تم التحقق من المستخدم – الآن نبدأ باستقبال الأحداث

  socket.on("updateAdmin", async (data) => {
    try {
      const admin = await Admin.findOne({ phone: data.id });
      if (admin?.connection) {
        socket.to(admin.connectionId).emit("updateAdmin", data);
      } else {
        await waitForConnection(
          Admin,
          { phone: "0910808060" },
          "updateAdmin",
          data
        );
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("updateUser", async (data) => {
    try {
      const user = await User.findById(data.userID);
      if (user?.connection) {
        socket.to(user.connectionId).emit("updateUser", data);
      } else {
        await waitForConnection(User, { _id: data.userID }, "updateUser", data);
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("updateStore", async (data) => {
    try {
      console.log("updateStore ", data);
      const store = await Store.findById(data.storeID);
      if (store?.connection) {
        socket.to(store.connectionId).emit("updateStore", data);
      } else {
        await waitForConnection(
          Store,
          { _id: data.storeID },
          "updateStore",
          data
        );
      }

      const admin = await Admin.findOne({ phone: "0910808060" });
      if (admin?.connection) {
        socket.to(admin.connectionId).emit("updateAdmin", data);
        console.log("updateStore ", data);
      } else {
        await waitForConnection(
          Admin,
          { phone: "0910808060" },
          "updateAdmin",
          data
        );
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("updateDriver", async (data) => {
    try {
      if (data.type === "chat") {
        const driver = await Driver.findOne({ phone: data.id });
        if (driver?.connection) {
          socket.to(driver.connectionId).emit("updateDriver", data);
        }
      } else {
        socket.to("drivers").emit("updateDriver", data);
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log(`🟢 User ${socket.id} joined room: ${roomName}`);
  });

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
    console.log(`🟡 User ${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", async () => {
    try {
      const types = [User, Store, Driver];
      for (const Model of types) {
        const user = await Model.findOne({ connectionId: socket.id });
        if (user) {
          await Model.updateOne(
            { _id: user._id },
            { $set: { connection: false, connectionId: null } }
          );
          console.log(`🔴 ${Model.modelName} disconnected: ${socket.id}`);
          break;
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
}

// 🔁 دالة تساعد في الانتظار حتى يتصل الطرف الآخر
async function waitForConnection(Model, condition, event, data) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const target = await Model.findOne(condition);
      if (target?.connection || attempts > 180) {
        if (target?.connection) {
          socket.to(target.connectionId).emit(event, data);
        }
        clearInterval(interval);
        resolve();
      }
    }, 5000);
  });
}

module.exports = { createserver, connect };
