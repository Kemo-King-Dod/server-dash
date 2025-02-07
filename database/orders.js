const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders = new Schema({
  order_id: {
    type: String
  },
  customer_id: {
    type: String
  },
  store_id: {
    type: String
  },
  driver_id: {
    type: String
  },
  date: {
    type: Date
  },
  items: {
    type: Array
  },
  total_price: {
    type: Number
  },
  status: {
    type: String
  },
  location: {
    type: Object
  },
  distenationPrice: {
    type: Number
  },
  reseve_code: {
    type: String
  },
  chat: {
    type: Object
  },
});

module.exports = mongoose.model("Order", orders);
