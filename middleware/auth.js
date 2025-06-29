const jwt = require("jsonwebtoken");
const User = require("../database/users");
const Driver = require("../database/driver");
const Store = require("../database/store");
const Admin = require("../database/admin");

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
const auth = async (req, res, next) => {
  try {
    const raw = req.header("Authorization") || "";
    const token = raw.replace(/^Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ error: true, message: "يرجى تسجيل الدخول" });
    }

    const { id } = jwt.verify(token, JWT_SECRET);

    // دالة مساعد لجلب المستخدم من أي مجموعة
    const findById = (model) => model.findById(id).lean ? model.findById(id) : null;

    let user =
      (await findById(User))   ||
      (await findById(Driver)) ||
      (await findById(Store))  ||
      (await findById(Admin));

    if (!user) {
      return res.status(401).json({ error: true, message: "المستخدم غير موجود" });
    }

    const fcmToken = req.headers["fcm_token"] || req.headers["fcm-token"];
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();            // لن يُنفّذ إلا إذا كانت الوثيقة موجودة فعلًا
    }

    req.userId = id;
    req.user   = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: true, message: "فشل التحقق من الهوية" });
  }
};


module.exports = { auth };
