module.exports = {
          apps: [
                    {
                              name: "fasto",
                              script: "server.js",
                              watch: true,

                              // ❌ أضف هنا الملفات أو المجلدات التي يتغيّر محتواها أثناء التشغيل
                              ignore_watch: [
                                        "data",
                                        // "data/order.txt",   // عدّاد الطلبات
                                        // "data/data.txt",   // عدّاد الطلبات
                                        "logs",             // ملفات السجلات
                                        "uploads",   // أي ملفات يرفعها المستخدم,
                                        "node_modules", // مجلد node_modules
                              ],

                              env: {
                                        NODE_ENV: "development", 
                                        PORT: 3000
                              },
                              env_production: { NODE_ENV: "production",PORT: 4000 }
                    }
          ]
};
