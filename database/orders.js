const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders = new Schema({
  orderId: {
    type: String
  },
  customerId: {
    type: String
  },
  storeId: {
    type: String
  },
  driverId: {
    type: String
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
    type: Object
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
});

module.exports = mongoose.model("Order", orders);
