const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const admin = new Schema({
  city: {
    type: String,
    default: "all",
  },
  name: {
    type: String,
    require: [true, "الإسم مطلوب"],
  },
  password: {
    type: String,
    require: [true, "كلمة السر مطلوبة"],
  },
  phone: {
    type: String,
    length: 10,
    require: [true, "رقم الهاتف مطلوب"],
  },
  userType: {
    type: String,
  },
  fcmToken: {
    type: String,
  },
  otp: {
    type: String,
  },
  connection: {
    type: Boolean,
    require: [true, "الإتصال مطلوب"],
    default: false,
  },
  connectionId: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
});
const Admin = mongoose.model("Admin", admin);
module.exports = Admin
