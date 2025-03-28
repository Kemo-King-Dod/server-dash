const { Server } = require("socket.io");
const Store = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver");
const Order = require("../database/orders");
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
            if (exist && exist.connection) return
            if (!exist) {
              exist = await Store.findOne({ _id: data.id });
              if (exist && exist.connection) return
              if (!exist) {
                exist = await Driver.findOne({ _id: data.id });
                if (!exist) {
                  console.log("access denied");
                }
                else {
                  if (exist && exist.connection) return
                  await Driver.updateOne(
                    { _id: data.id },
                    { $set: { connection: true, connectionId: socket.id } }
                  );
                  socket.join("drivers");
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
    if (data.type == "chat") {
      const user = await User.findOne({ phone: data.id })
      if (user.connection)
        await socket.to(user.connectionId).emit("updateUser", data);
      return
    }

    try {
      console.log('------------------------')
      console.log(data)
      console.log('------------------------')
      let user = await User.findById(data.userID);
      if (!user)
        throw new Error('there is no user')
      let timesToSendRequist = 0; // to 180
      if (user.connection == false) {
        const times = setInterval(async () => {
          timesToSendRequist++;
          user = await User.findById(data.userID)
          if (!user)
            throw new Error('there is no user')
          if (user.connection || timesToSendRequist > 180) {
            socket.to(user.connectionId).emit("updateUser", data)
            clearInterval(times)
          }
        }, 5000);
      }
      if (user.connection) {
        socket.to(user.connectionId).emit("updateUser", data);
      }
    } catch (error) {
      console.log(error)
    }

    // socket.to().emit("updateUser", data)
  })

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
      console.log(error)
    }
  });

  socket.on("updateDriver", async (data) => {
    if (data.type == "chat") {
      const driver = await Driver.findOne({ phone: data.id })
      if (driver.connection)
        socket.to(driver.connectionId).emit("updateDriver", data);
    }
    else
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
    console.log("User disconnected:" + socket.id)
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
