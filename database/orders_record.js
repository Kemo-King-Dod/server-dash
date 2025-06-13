const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders_record = new Schema({
  orderId: {
    type: String
  },
  customer: {
    type: Object
  },
  driver: {
    type: Object
  },
  store: {
    type: Object
  },
  date: {
    type: Date
  },
  items: {
    type: Array
  },
  totalPrice: {
    type: Number
  },
  status: {
    type: String
  },
  type: {
    type: String
  },
  address: {
    type: Object,
    require: [true, 'العنوان مطلوب']
  },
  distenationPrice: {
    type: Number
  },
  reseveCode: {
    type: String
  },
  chat: {
    type: Object
  },
  canceledby: {
    type: "String"
  },
  companyFee: {
    type: Number
  },
});

module.exports = mongoose.model("OrderRecodr", orders_record);
