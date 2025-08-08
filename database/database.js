const mongoose = require("mongoose");

const connecting = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://murafiq00:123456%402025@murafiq.lmuoyzo.mongodb.net/fasto?retryWrites=true&w=majority&appName=Murafiq",
      {
        serverApi: { version: "1", strict: true, deprecationErrors: true },

        // ⚡ إعدادات مهمة لتقليل مشاكل ECONNRESET
        maxPoolSize: 10,                 // حجم البوول (الاتصالات) - يمنع الضغط الزائد
        serverSelectionTimeoutMS: 5000,  // مهلة اختيار السيرفر
        socketTimeoutMS: 45000,          // مهلة السوكيت
        heartbeatFrequencyMS: 10000,     // فحص الاتصال كل 10 ثواني
        maxIdleTimeMS: 30000,            // يغلق الاتصالات الخاملة بعد 30 ثانية
        connectTimeoutMS: 10000,         // مهلة أولية للاتصال

        family: 4, // IPv4 فقط (يتفادى مشاكل IPv6 في بعض الشبكات)
      }
    );

    console.log("✅ MongoDB connection success");
  } catch (err) {
    console.error("❌ MongoDB connection failed");
    console.error(err);
  }
};

module.exports = connecting;
