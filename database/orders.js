const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders = new Schema({
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
  companyFee: {
    type: Number
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
    type: String,
    default: Math.round(Math.random() * 100000)
  },
  chat: {
    type: Object,
    default: []
  },
  numberOfUnreadForDriver: {
    type: Number,
    default: 0
  },
  numberOfUnreadForUser: {
    type: Number,
    default: 0
  },
  city: {
    type: Object
  },
  ByCode:{
    type:Boolean,
    default:false,
  },
  handcheck: {
    type: Boolean,
    default: false,
  },
  billingType:{
    type: String,
    default: "cash",
  }
})
const Order = mongoose.model("Order", orders)
module.exports = Order;
