const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stores = new Schema(
  {
    name: {
      type: String,
      require: [true, "الإسم مطلوب"],
    },
    phone: {
      type: String,
      length: 10,
      require: [true, "رقم الهاتف مطلوب"],
    },
    password: {
      type: String,
      require: [true, "كلمة السر مطلوبة"],
    },
    storeType: {
      type: String,
      require: [true, "النوع مطلوب"],
    },
    deliveryCostByKilo: {
      type: Number,
      require: [true, "السعر مطلوب"],
      default: 5.0,
    },
    companyFee: {
      type: Number,
      default: 2.0,
    },
    idNumber: {
      type: String,
      require: [true, "رقم الهوية مطلوب"],
    },
    licenseNumber: {
      type: String,
      require: [true, "رقم الرخصة مطلوب"],
    },
    location: {
      type: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      required: [true, "الموقع مطلوب"],
    },
    address: {
      type: String,
      require: [true, "العنوان مطلوب"],
    },
    ownerName: {
      type: String,
    },
    city: {
      type: String,
    },
    picture: {
      type: String,
      require: [true, "صورة المتجر مطلوبة"],
    },
    registerCondition: {
      type: String,
      default: "accepted",
    },
    items: {
      type: Array,
    },
    connection: {
      type: Boolean,
      default: false,
    },
    connectionId: {
      type: String,
      default: false,
    },
    orders: {
      type: Array,
    },
    RetrenchmentsNumbers: {
      type: Array,
    },
    hasDiscount: {
      type: Boolean,
      default: false,
    },
    totalCommission: {
      type: Number,
    },
    moneyRecord: {
      type: Array,
    },
    discription: {
      type: String,
    },
    notificationsCondition: {
      type: Boolean,
      default: true,
    },
    openCondition: {
      type: Boolean,
      default: false,
    },
    registerHistory: {
      type: Date,
    },
    opentimeam: {
      type: String,
      default: null,
    },
    closetimeam: {
      type: String,
      default: null,
    },
    opentimepm: {
      type: String,
      default: null,
    },
    closetimepm: {
      type: String,
      default: null,
    },
    // اللي المحل يبيه منا
    funds: {
      type: Number,
      default: null,
    },
    lastWidrawal: {
      type: Number,
      default: null,
    },
    userType: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    followersNumber: {
      type: Number,
      default: 0,
    },
    otp: {
      type: String,
    },
    ByCode: {
      type: Boolean,
      default: false,
    },
    blockUntil: {
      type: Date,
    },
    timesForgetPassword: {
      type: Number,
      default: 0,
    },
    handcheck: {
      type: Boolean,
      default: false,
    },
    isModfiy: {
      type: Boolean,
      default: false,
    },
    modfingPrice: {
      type: Number,
      default: 0.0,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0
    },
    ratingUsers:{
      type:Number,
      default: 0
    },
    rate:{
      type:Number,
      default:0
    }
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model("Store", stores);

module.exports = Store;