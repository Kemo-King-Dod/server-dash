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
              exist = await Admin.findOne({ _id: data.id });
              if (exist) {
                await Admin.updateOne(
                  { _id: data.id },
                  { $set: { connection: true, connectionId: socket.id } }
                );
                socket.join("admins");
                console.log("isAdmin.......");
              }
            } else if (!exist) {
              exist = await Store.findOne({ _id: data.id });
              if (!exist) {
                exist = await Driver.findOne({ _id: data.id });
                if (!exist) {
                  console.log("access denied");
                } else {
                  await Driver.updateOne(
                    { _id: data.id },
                    { $set: { connection: true, connectionId: socket.id } }
                  );
                  socket.join("drivers"); // Fixed: Changed socket() to socket.join()
                  console.log(`Driver ${exist.name} (ID: ${exist._id}) successfully joined drivers room`);
                }
              } else {
                // Fixed: Added missing else block to properly handle store connection
                await Store.updateOne(
                  { _id: data.id },
                  { $set: { connection: true, connectionId: socket.id } }
                );
              }
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
    console.log(error);
  }
  console.log("hello")
  socket.on("updateAdmin", async (data) => {
    if (data.type == "chat") {
      try {
        const admin = await Admin.findOne({ phone: data.id });
        if (admin && admin.connection) {
          await socket.to(admin.connectionId).emit("updateAdmin", data);
        }
        return;
      } catch (error) {
        console.log(error);
        return;
      }
    }

    try {
      console.log(data);
      let admin = await Admin.findOne({ phone: "0910808060" });
      if (!admin) throw new Error("there is no user");

      if (admin.connection) {
        socket.to(admin.connectionId).emit("updateAdmin", data);
      } else {
        let timesToSendRequist = 0; // to 180
        const times = setInterval(async () => {
          timesToSendRequist++;
          admin = await Admin.findOne({ phone: "0910808060" });
          if (!admin) {
            clearInterval(times);
            throw new Error("there is no user");
          }
          if (admin.connection || timesToSendRequist > 180) {
            if (admin.connection) {
              socket.to(admin.connectionId).emit("updateAdmin", data);
            }
            clearInterval(times);
          }
        }, 5000);
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("updateUser", async (data) => {
    if (data.type == "chat") {
      try {
        const user = await User.findOne({ phone: data.id });
        if (user && user.connection) {
          await socket.to(user.connectionId).emit("updateUser", data);
        }
        return;
      } catch (error) {
        console.log(error);
        return;
      }
    }

    try {
      console.log(data);
      let user = await User.findById(new mongoose.Types.ObjectId(data.userID));
      if (!user) throw new Error("there is no user");

      if (user.connection) {
        socket.to(user.connectionId).emit("updateUser", data);
      } else {
        let timesToSendRequist = 0; // to 180
        const times = setInterval(async () => {
          timesToSendRequist++;
          user = await User.findById(new mongoose.Types.ObjectId(data.userID));
          if (!user) {
            clearInterval(times);
            throw new Error("there is no user");
          }
          if (user.connection || timesToSendRequist > 180) {
            if (user.connection) {
              socket.to(user.connectionId).emit("updateUser", data);
            }
            clearInterval(times);
          }
        }, 5000);
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("updateStore", async (data) => {
    try {
      
      let store = await Store.findById( new mongoose.Types.ObjectId(data.storeID) );
      if (!store) {
        throw new Error("Store not found");
      }
      let admin = await Admin.findOne({ phone: "0910808060" });

      if (store.connection) {
        socket.to(store.connectionId).emit("updateStore", data);
      } else {
        let timesToSendRequist = 0; // to 180
        const times = setInterval(async () => {
          timesToSendRequist++;
          store = await Store.findById(new mongoose.Types.ObjectId(data.storeID));
          if (!store) {
            clearInterval(times);
            throw new Error("Store not found");
          }
          if (store.connection || timesToSendRequist > 180) {
            if (store.connection) {
              socket.to(store.connectionId).emit("updateStore", data);
            }
            clearInterval(times);
          }
        }, 5000);
      }
      console.log("admin and ", data);
      if (admin.connection) {
        socket.to(admin.connectionId).emit("updateAdmin", data);
        console.log("admin and ", data);
      } else {
        let timesToSendRequist = 0; // to 180
        const times = setInterval(async () => {
          timesToSendRequist++;
          admin = await Admin.findOne({ phone: "0910808060" });
          console.log("admin and ", data);

          if (!admin) {
            clearInterval(times);
            throw new Error("Store not found");
          }
          if (admin.connection || timesToSendRequist > 180) {
            if (admin.connection) {
              console.log("admin and ", data);

              socket.to(admin.connectionId).emit("updateAdmin", data);
            }
            clearInterval(times);
          }
        }, 5000);
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("updateDriver", async (data) => {
    try {
      console.log("update driver Working " , data);
      if (data.type == "chat") {
        const driver = await Driver.findOne({ phone: data.id });
        if (driver && driver.connection) {
          socket.to(driver.connectionId).emit("updateDriver", data);
        }
      } else {
      console.log("update to all Drivers Working " , data);

        socket.to("drivers").emit("updateDriver", data);
      }
    } catch (error) {
      console.log(error);
    }
  });

  // socket.on("reconnect", async (token) => {
  //   if (token) {
  //     await jwt.verify(
  //       token,
  //       "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman",
  //       async (err, data) => {
  //         if (err) {
  //           console.log("يرجى تسجيل الدخول");
  //         } else {
  //           let exist = await User.findOne({ _id: data.id });
  //           if (!exist) {
  //             exist = await Store.findOne({ _id: data.id });
  //             if (!exist) {
  //               exist = await Driver.findOne({ _id: data.id });
  //               if (!exist) {
  //                 console.log("access denied");
  //                 return;
  //               }
  //               // Fixed: Added missing driver reconnection handling
  //               await Driver.updateOne(
  //                 { _id: data.id },
  //                 { $set: { connection: true, connectionId: socket.id } }
  //               );
  //               socket.join("drivers");
  //             } else {
  //               await Store.updateOne(
  //                 { _id: data.id },
  //                 { $set: { connection: true, connectionId: socket.id } }
  //               );
  //             }
  //           } else {
  //             await User.updateOne(
  //               { _id: data.id },
  //               { $set: { connection: true, connectionId: socket.id } }
  //             );
  //           }
  //         }
  //       }
  //     );
  //   }
  // });

  socket.on("disconnect", async () => {
    try {
      let exist = await Store.findOne({ connectionId: socket.id });
      if (!exist) {
        exist = await User.findOne({ connectionId: socket.id });
        if (!exist) {
          exist = await Driver.findOne({ connectionId: socket.id });
          if (!exist) {
            return;
          }
          // Fixed: Added missing driver disconnect handling
          console.log("driver disconnected ", socket.id);
          await Driver.updateOne(
            { connectionId: socket.id },
            { $set: { connection: false, connectionId: null } }
          );
        } else {
          await User.updateOne(
            { connectionId: socket.id },
            { $set: { connection: false, connectionId: null } }
          );
        }
      } else {
        await Store.updateOne(
          { connectionId: socket.id },
          { $set: { connection: false, connectionId: null } }
        );
      }
      console.log("User disconnected:" + socket.id);
    } catch (error) {
      console.log(error);
    }
  });

  // socket.on("stillConnect", async (token) => {
  //   userisstillconnected(socket);
  //   if (token) {
  //     await jwt.verify(
  //       token,
  //       "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman",
  //       async (err, data) => {
  //         if (err) {
  //           return;
  //         } else {
  //           let exist = await User.findOne({ _id: data.id });
  //           if (!exist) {
  //             exist = await Store.findOne({ _id: data.id });
  //             if (!exist) {
  //               exist = await Driver.findOne({ _id: data.id });
  //               if (!exist) {
  //                 return;
  //               }
  //               // Fixed: Added missing driver stillConnect handling
  //               await Driver.updateOne(
  //                 { _id: data.id },
  //                 { $set: { connection: true, connectionId: socket.id } }
  //               );
  //               socket.join("drivers");
  //             } else {
  //               await Store.updateOne(
  //                 { _id: data.id },
  //                 { $set: { connection: true, connectionId: socket.id } }
  //               );
  //             }
  //           } else {
  //             await User.updateOne(
  //               { _id: data.id },
  //               { $set: { connection: true, connectionId: socket.id } }
  //             );
  //           }
  //         }
  //       }
  //     );
  //   }
  // });

  // انضمام المستخدم إلى غرفة خاصة

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log("User " + socket.id + " joined room: " + roomName);
  });

  // مغادرة المستخدم للغرفة
  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
    console.log("User " + socket.id + " left room: " + roomName);
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
