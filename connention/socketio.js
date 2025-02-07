const { Server } = require("socket.io");
const Store = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver")
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

  if (socket.headers.authorization) {
    await jwt.verify(
      socket.headers.authorization,
      "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
      async (err, data) => {
        if (err) {
          res.status(403).json({
            error: true,
            data: "يرجى تسجيل الدخول",
          });
          res.end();
        } else {
          let exist = await User.findOne({ _id: data.id });
          if (!exist) {
            exist = await Store.findOne({ _id: data.id });
            if (!exist) {
              res.json({ error: true, data: "access denied" });
            }
            await Store.updateOne(
              { _id: data.id },
              { $set: { connection: true, connection_id: socket.id } }
            );
          } else {
            await User.updateOne(
              { _id: data.id },
              { $set: { connection: true, connection_id: socket.id } }
            );
          }
        }
      }
    );
  }

  
  socket.on("UpdateUser", async (data) => {

    // عمليات


    socket.emit("UpdateUser", data.func)
  })

  socket.on("UpdateStore", async (data) => {

    // عمليات


    socket.emit("UpdateStore", data.func)
  })

  socket.on("UpdateDriver", async (data) => {

    // عمليات


    socket.emit("UpdateDriver", data.func)
  })



  socket.on("reconnect", async (token) => {
    if (token) {
      await jwt.verify(
        token,
        "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
        async (err, data) => {
          if (err) {
            res.status(403).json({
              error: true,
              data: "يرجى تسجيل الدخول",
            });
            res.end();
          } else {
            let exist = await Store.findOne({ _id: data.id });
            if (!exist) {
              exist = await User.findOne({ _id: data.id });
              if (!exist) {
                res.json({ error: true, data: "access denied" });
              }
              await User.updateOne(
                { _id: data.id },
                { $set: { connection: true, connection_id: socket.id } }
              );
            } else {
              await Store.updateOne(
                { _id: data.id },
                { $set: { connection: true, connection_id: socket.id } }
              );
            }
          }
        }
      );
    }
  });

  socket.on("disconnect", async () => {
    let exist = await Store.findOne({ connection_id: socket.id });
    if (!exist) {
      exist = await User.findOne({ connection_id: socket.id });
      if (!exist) {
        return;
      }
      await User.updateOne(
        { connection_id: socket.id },
        { $set: { connection: false, connection_id: null } }
      );
    } else {
      await Store.updateOne(
        { connection_id: socket.id },
        { $set: { connection: false, connection_id: null } }
      );
    }
  });

  socket.on("stillConnect", async (token) => {
    userisstillconnected(socket);
    console.log(token);
    if (token) {
      await jwt.verify(
        token,
        "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
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
                { $set: { connection: true, connection_id: socket.id } }
              );
            } else {
              await Store.updateOne(
                { _id: data.id },
                { $set: { connection: true, connection_id: socket.id } }
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
    console.log('User' + socket.id + ' joined room:' + roomName);
  });

  // مغادرة المستخدم للغرفة
  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
    console.log('User' + socket.id + ' left room:' + roomName);
  });

  socket.on("disconnect", () => {
    console.log('User disconnected:' + socket.id);
  });
}

function isuserconnected(socket) {
  isconnected = setTimeout(async () => {
    let exist = await Store.findOne({ connection_id: socket.id });
    if (!exist) {
      exist = await User.findOne({ connection_id: socket.id });
      if (!exist) {
        return;
      }
      await User.updateOne(
        { connection_id: socket.id },
        { $set: { connection: false, connection_id: null } }
      );
    } else {
      await Store.updateOne(
        { connection_id: socket.id },
        { $set: { connection: false, connection_id: null } }
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
