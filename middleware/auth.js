const jwt = require("jsonwebtoken");
const User = require("../database/users");
const Driver = require("../database/driver");
const Store = require("../database/store");
const Admin = require("../database/admin");

const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        error: true,
        message: "يرجى تسجيل الدخول",
      });
    }

    const decoded = await jwt.verify(token, JWT_SECRET);

    let exist = await User.findOne({ _id: decoded.id });
    if (!exist) exist = await Driver.findOne({ _id: decoded.id });
    if (!exist) exist = await Store.findOne({ _id: decoded.id });

    // Find user across all collections
    if (!exist) exist = await Admin.findOne({ _id: decoded.id });
    exist.fcmToken = req.headers["fcm_token"];
    await exist.save();
    req.userId = decoded.id;
    req.user = exist;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      error: true,
      message: "يرجى الدخول",
    });
  }
};

module.exports = { auth };
