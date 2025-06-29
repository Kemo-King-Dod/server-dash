const mongoose = require("mongoose");
const User = require("./users");

const connecting = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://murafiq00:123456%402025@murafiq.lmuoyzo.mongodb.net/fasto?retryWrites=true&w=majority&appName=Murafiq",
      {
        serverApi: { version: "1", strict: true, deprecationErrors: true },
      }
    );
    console.log("✅ connection success");

    // ‼️ احصل على buildInfo من الخادم

  } catch (err) {
    console.error("❌ connection failed");
    console.error(err);
  }
};

module.exports = connecting;

// mongodb+srv://abdelrhamn98:0922224420@cluster0.7dk3i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
