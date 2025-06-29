const mongoose = require('mongoose')

const connecting = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://murafiq00:123456%402025@murafiq.lmuoyzo.mongodb.net/fasto?retryWrites=true&w=majority&appName=Murafiq"
    );
    console.log("✅ connection success");

    // ‼️ احصل على buildInfo من الخادم
    const info = await mongoose.connection.db
      .admin()
      .command({ buildInfo: 1 });

    console.log("🛈 MongoDB server version →", info.version); // مثل 8.1.1
  } catch (err) {
    console.error("❌ connection failed");
    console.error(err);
  }
};

module.exports = connecting

// mongodb+srv://abdelrhamn98:0922224420@cluster0.7dk3i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0