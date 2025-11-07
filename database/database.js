const mongoose = require("mongoose");
require("dotenv").config();

// ملاحظة: رسائل الخطأ بالإنجليزية حسب التفضيلات، والتعليقات بالعربية للتوضيح

// ⚙️ خيارات الاتصال الافتراضية (مع إمكانية ضبطها عبر متغيرات البيئة)
const getMongooseOptions = () => ({
  serverApi: { version: "1", strict: true, deprecationErrors: true },

  // 🛠 إعدادات الشبكة والمهل لتقليل أخطاء انتهاء المهلة وHandshake
  maxPoolSize: parseInt(process.env.MAX_POOL_SIZE || "10", 10),
  minPoolSize: parseInt(process.env.MIN_POOL_SIZE || "2", 10),
  serverSelectionTimeoutMS: parseInt(
    process.env.SERVER_SELECTION_TIMEOUT_MS || "30000",
    10
  ),
  socketTimeoutMS: parseInt(process.env.SOCKET_TIMEOUT_MS || "45000", 10),
  connectTimeoutMS: parseInt(process.env.CONNECT_TIMEOUT_MS || "30000", 10),
  heartbeatFrequencyMS: parseInt(process.env.HEARTBEAT_FREQUENCY_MS || "10000", 10),
  maxIdleTimeMS: parseInt(process.env.MAX_IDLE_TIME_MS || "30000", 10),

  // ملاحظة: خيارات keepAlive صارت غير مدعومة في mongodb driver v5
  // وتمكينها داخليًا؛ لذا قمنا بإزالتها لتجنب MongoParseError

  // يفضل IPv4 لتجنب مشاكل IPv6 في بعض الشبكات
  family: parseInt(process.env.IP_FAMILY || "4", 10),

  // دعم TLS قابل للتفعيل إن لزم (غالبًا mongodb+srv يفرض TLS تلقائيًا)
  ...(process.env.MONGO_TLS ? { tls: process.env.MONGO_TLS === "true" } : {}),
});

// 🔁 دالة اتصال مع إعادة المحاولة (Exponential Backoff)
const connectWithRetry = async (uri, options, retries = 5) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      await mongoose.connect(uri, options);
      console.log("✅ MongoDB connection success");
      return;
    } catch (err) {
      attempt++;
      const delay = Math.min(1000 * 2 ** attempt, 15000); // تزايد أسّي حتى 15 ثانية
      console.error(
        `❌ MongoDB connection failed (attempt ${attempt}/${retries}) — ${err.name}: ${err.message}`
      );
      // معلومات مفيدة للتشخيص
      if (err.name === "MongoNetworkTimeoutError") {
        console.error(
          "Hint: Network/TLS handshake timed out. Check firewall, IP whitelist, DNS, and port 27017."
        );
      } else if (err.name === "MongoServerSelectionError") {
        console.error(
          "Hint: Server selection failed. Verify URI, SRV/DNS resolution, and cluster accessibility."
        );
      }
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("🚫 Exhausted retries. Please verify network and MongoDB settings.");
        throw err;
      }
    }
  }
};

// 📡 إعداد مستمعي أحداث الاتصال لمزيد من الرصد
mongoose.connection.on("connected", () => {
  console.log("🔌 Mongoose connected");
});
mongoose.connection.on("error", (err) => {
  console.error("⚠️ Mongoose connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("🔌 Mongoose disconnected");
});

// ⏱️ زيادة مهلة انتظار العمليات المؤقتة أثناء محاولة الاتصال
// لمنع أخطاء مثل: buffering timed out after 10000ms
try {
  const bufferTimeout = parseInt(process.env.BUFFER_TIMEOUT_MS || "30000", 10);
  mongoose.set("bufferTimeoutMS", bufferTimeout);
} catch (e) {
  // تجاهل أي خطأ في الإعداد
}

// 🚀 الدالة المصدرة لبدء الاتصال
const connecting = async () => {
  // استخدام متغير البيئة لتجنب كشف بيانات الدخول داخل الكود
  const uri = process.env.MONGODB_URI ||
    "mongodb+srv://murafiq00:123456%402025@murafiq.lmuoyzo.mongodb.net/fasto?retryWrites=true&w=majority&appName=Murafiq";
  const options = getMongooseOptions();
  await connectWithRetry(uri, options, parseInt(process.env.DB_MAX_RETRIES || "5", 10));
};

module.exports = connecting;
