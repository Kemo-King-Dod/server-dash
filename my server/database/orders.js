const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders = new Schema({
  shopid: {
    type: String
  },
  items: {
    type: Array
  },
  total: {
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
  driver: {
    type: String
  },
});

module.exports = mongoose.model("Order", orders);
