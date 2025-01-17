const express = require("express");
const route = express.Router();
const bcrypt = require("bcrypt");
const Shop = require("../database/shops");
const User = require("../database/users");
const jwt = require("jsonwebtoken");
const path = require("path");

const sign = function (id) {
  return jwt.sign({ id }, "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman");
};

route.post("/shopsignup", async (req, res) => {
  const existshop = await Shop.findOne({ phone: req.body.phone });
  // const existdriver = await driver.findOne({ phone: req.body.phone });
  // const existcustomer = await customer.findOne({ phone: req.body.phone });
  if (existshop /*  || existdriver || existcustomer */) {
    res.send({
      error: true,
      data: " رقم الهاتف موجود بالفعل",
    });
  } else {
    const shop = {
      name: req.body.name,
      phone: req.body.phone,
      password: await bcrypt.hash(req.body.password, 10),
      condition: "waiting",
      date: Date.now(),
      location: req.body.location,
      storeType: req.body.storeType,
      userType: "Store",
      opened: false,
      opentimeam: "",
      closetimeam: "",
      opentimepm: "",
      closetimepm: "",
      items: [],
      connection: false,
      connection_id: "",
    };
    await Shop.create(shop);
    const the_user = await Shop.findOne({ phone: shop.phone });
    const data = sign(the_user._id);
    res.status(200).send({ error: false, token: data });
  }
});

route.post("/login", async (req, res) => {
  let exist = await Shop.findOne({ phone: req.body.phone });
  if (!exist) exist = await User.findOne({ phone: req.body.phone });
  if (!exist) {
    res.send({
      error: true,
      data: " رقم الهاتف غير موجود",
    });
  } else {
    const valid = await bcrypt.compare(req.body.password, exist.password);
    if (!valid) {
      res.send({
        error: true,
        data: "كلمة المرور غير صحيحة",
      });
    } else {
      let user;
      if (exist.userType == "Store")
        user = {
          condition: exist.condition,
          userType: exist.userType,
        };
      else
        user = {
          userType: exist.userType,
        };
      const data = sign(exist._id);
      res.status(200).send({ error: false, token: data, user });
    }
  }
});

route.get("/getshops", async (req, res) => {
  let exist = await Shop.find();
  if (!exist) {
    res.json({ error: true, data: "ليس هناك متاجر" });
  } else {
    res.json({ error: false, data: exist });
  }
});


route.post("/getlocations", async (req, res) => {
  if (req.body.token) {
    await jwt.verify(
      req.body.token,
      "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
      async (err, data) => {
        if (err) {
          res.status(403).json({
            error: true,
            data: "يرجى تسجيل الدخول",
          });
          res.end();
        } else {
          const user = await User.findOne({ _id: data.id });
          res.json({ error: false, data: user.location });
        }
      }
    );
  }
});

module.exports = route;