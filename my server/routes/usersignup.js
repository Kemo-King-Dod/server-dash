const express = require("express");
const route = express.Router();
const bcrypt = require("bcrypt");
const User = require("../database/users");
const Shop = require("../database/shops");

const jwt = require("jsonwebtoken");
const path = require("path");

const sign = function (id) {
  return jwt.sign({ id }, "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman");
};

route.post("/usersignup", async (req, res) => {
    
  const existshop = await Shop.findOne({ phone: req.body.phone });
  const existuser = await User.findOne({ phone: req.body.phone });
  // const existdriver = await driver.findOne({ phone: req.body.phone });
  // const existcustomer = await customer.findOne({ phone: req.body.phone });
  if (existshop || existuser /* || existdriver */) {
    res.send({
      error: true,
      data: " رقم الهاتف موجود بالفعل",
    });
  } else {
    const user = {
      name: req.body.name,
      phone: req.body.phone,
      password: await bcrypt.hash(req.body.password, 10),
      location: [],
      userType: "customer",
      cart: [],
      orders: [],
      favorite: [],
      connection:false,
      connection_id:""
    };
    await User.create(user);
    const the_user = await User.findOne({ phone: user.phone });
    const data = sign(the_user._id);
    res.status(200).send({ error: false, token: data });
  }
});


module.exports = route;
