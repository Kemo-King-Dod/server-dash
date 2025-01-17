const { Server } = require("socket.io");
const Shop = require("../database/store");
const User = require("../database/users");
const Driver = require("../database/driver")
const jwt = require("jsonwebtoken");

let isconnected;

function createserver(server) {
  return new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
}
function connect(socket) {
  socket.on("data", async (token) => {
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
            let exist = await Shop.findOne({ _id: data.id });
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
              await Shop.updateOne(
                { _id: data.id },
                { $set: { connection: true, connection_id: socket.id } }
              );
            }
          }
        }
      );
    }
  });

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
            let exist = await Shop.findOne({ _id: data.id });
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
              await Shop.updateOne(
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
    let exist = await Shop.findOne({ connection_id: socket.id });
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
      await Shop.updateOne(
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
            let exist = await Shop.findOne({ _id: data.id });
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
              await Shop.updateOne(
                { _id: data.id },
                { $set: { connection: true, connection_id: socket.id } }
              );
            }
          }
        }
      );
    }
  });
}

function isuserconnected(socket) {
  isconnected = setTimeout(async () => {
    let exist = await Shop.findOne({ connection_id: socket.id });
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
      await Shop.updateOne(
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

async function disconnect(socket) {} 

module.exports = { createserver, connect };
