module.exports = {
  apps: [
    {
      // السيرفر الحقيقي للزبائن
      name: "fasto-prod",
      script: "server.js",

      // ما يعيدش التشغيل تلقائياً مع أي تغيير في الملفات
      watch: false,

      // حتى لو watch=false نقدر نخلي القائمة موجودة كتوثيق
      ignore_watch: [
        "categories",
        "uploads",
        "logs",
        "data",
        "utils/categories.json"
      ],

      env: {
        NODE_ENV: "production",
        PORT: 4000, // المنفذ الرسمي للانتاج
      },
    },
    {
      // نسخة التطوير للتجارب
      name: "fasto-dev",
      script: "server.js",

      // أي تعديل في الكود (أو git pull يغير ملفات) => restart تلقائي
      watch: true,

      // مجلدات ما نبيها تسبب restart
      ignore_watch: [
        "uploads",     // صور الزبائن
        "logs",        // ملفات لوق
        "data",        // ملفات runtime مؤقتة
        "node_modules" // لا داعي نراقبها
      ],

      env: {
        NODE_ENV: "development",
        PORT: 3000, // منفذ التطوير
      },
    },
  ],
};
