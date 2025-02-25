const { Server } = require("socket.io");
const Store = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");

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
    if (socket.handshake.headers.authorization) {
      await jwt.verify(
        socket.handshake.headers.authorization,
        "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman",
        async (err, data) => {
          if (err) {
            console.log(err);
            console.log("يرجى تسجيل الدخول");
          } else {
            let exist = await User.findOne({ _id: data.id });
            if (!exist) {
              exist = await Store.findOne({ _id: data.id });
              if (!exist) {
                exist = await Driver.findOne({ _id: data.id });
                await Driver.updateOne(
                  { _id: data.id },
                  { $set: { connection: true, connectionId: socket.id } }
                );
                data = {
                  name: exist.name,
                  orders: exist.orders.length,
                  funds: exist.funds
                }
                socket.to(socket.id).emit("getDriverResponse", data)
                socket.join("drivers");

                if (!exist) {
                  console.log("access denied");
                }
              }
              await Store.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            } else {
              await User.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            }
          }
        }
      );
    }
  } catch (error) {
    console.log(error)
  }

  socket.on("updateUser", async (data) => {
    // عمليات
    console.log(data);
    console.log("updateUser");
  });

  socket.on("updateStore", async (data) => {
    try {
      let store = await Store.findById(data.storeID);
      let timesToSendRequist = 0; // to 180
      if (store.connection == false) {
        const times = setInterval(async () => {
          timesToSendRequist++;
          store = await Store.findById(data.storeID);
          if (store.connection || timesToSendRequist > 180) {
            socket.to(store.connectionId).emit("updateStore", data);
            clearInterval(times);
          }
        }, 5000);
      }
      if (store.connection) {
        socket.to(store.connectionId).emit("updateStore", data);
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

  socket.on("updateDriver", async (data) => {
    socket.to("drivers").emit("updateDriver", data)
  });



  socket.on("reconnect", async (token) => {
    if (token) {
      await jwt.verify(
        token,
        "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman",
        async (err, data) => {
          if (err) {
            console.log("يرجى تسجيل الدخول");
          } else {
            let exist = await Store.findOne({ _id: data.id });
            if (!exist) {
              exist = await User.findOne({ _id: data.id });
              if (!exist) {
                console.log("access denied");
              }
              await User.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            } else {
              await Store.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            }
          }
        }
      );
    }
  });

  socket.on("disconnect", async () => {
    let exist = await Store.findOne({ connectionId: socket.id });
    if (!exist) {
      exist = await User.findOne({ connectionId: socket.id });
      if (!exist) {
        return;
      }
      await User.updateOne(
        { connectionId: socket.id },
        { $set: { connection: false, connectionId: null } }
      );
    } else {
      await Store.updateOne(
        { connectionId: socket.id },
        { $set: { connection: false, connectionId: null } }
      );
    }
  });

  socket.on("stillConnect", async (token) => {
    userisstillconnected(socket);
    console.log(token);
    if (token) {
      await jwt.verify(
        token,
        "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman",
        async (err, data) => {
          if (err) {
            return;
          } else {
            let exist = await Store.findOne({ _id: data.id });
            if (!exist) {
              exist = await User.findOne({ _id: data.id });
              if (!exist) {
                return;
              }
              await User.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            } else {
              await Store.updateOne(
                { _id: data.id },
                { $set: { connection: true, connectionId: socket.id } }
              );
            }
          }
        }
      );
    }
  });
  // انضمام المستخدم إلى غرفة خاصة
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log("User" + socket.id + " joined room:" + roomName);
  });

  // مغادرة المستخدم للغرفة
  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
    console.log("User" + socket.id + " left room:" + roomName);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:" + socket.id);
  });
}

function isuserconnected(socket) {
  isconnected = setTimeout(async () => {
    let exist = await Store.findOne({ connectionId: socket.id });
    if (!exist) {
      exist = await User.findOne({ connectionId: socket.id });
      if (!exist) {
        return;
      }
      await User.updateOne(
        { connectionId: socket.id },
        { $set: { connection: false, connectionId: null } }
      );
    } else {
      await Store.updateOne(
        { connectionId: socket.id },
        { $set: { connection: false, connectionId: null } }
      );
    }
  }, 1000 * 20);
}

function userisstillconnected(socket) {
  clearTimeout(isconnected);
  isconnected = false;
  isuserconnected(socket);
}

module.exports = { createserver, connect };
