const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../database/users");
const Shop = require("../database/shops");
const Item = require("../database/items");
const { use } = require("bcrypt/promises");

route.post("/addtocart", async (req, res) => {
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
          const updatedUser = await User.updateOne(
            { _id: data.id },
            { $push: { cart: req.body.id } }
          );
          const user = await User.findOne({ _id: data.id });

          res.json({ status: "succss", data: [...user.cart] });
        }
      }
    );
  }
});

route.post("/getfromcart", async (req, res) => {
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
          const shopsids = [];
          const itemsids = [];
          const shops = [];
          const items = [];

          user.cart.forEach(async (element) => {
            let flag = false;
            for (let d = 0; d < shopsids.length; d++) {
              if (shopsids.includes(element.shopid)) flag = true;
            }
            if (!flag) shopsids.push(element.shopid);
          });
          user.cart.forEach(async (element) => {
            let flag = false;
            for (let d = 0; d < itemsids.length; d++) {
              if (itemsids.includes(element.id)) flag = true;
            }
            if (!flag) itemsids.push(element.id);
          });

          for (let i = 0; i < shopsids.length; i++) {
            shops.push(await Shop.findOne({ _id: shopsids[i] }));
          }
          for (let i = 0; i < itemsids.length; i++) {
            items.push(await Item.findOne({ _id: itemsids[i] }));
          }

          const mycart = [];
          for (let i = 0; i < shops.length; i++) {
            mycart.push({ shop: shops[i], items: [], opt: [] });
            for (let j = 0; j < items.length; j++) {
              for (let s = 0; s < shops[i].items.length; s++) {
                if (shops[i].items[s].toString() == items[j]._id.toString()) {
                  for (let k = 0; k < mycart.length; k++) {
                    if (
                      mycart[k].shop._id.toString() == shops[i]._id.toString()
                    ) {
                      mycart[k].items.push(items[j]);
                      for (let l = 0; l < user.cart.length; l++) {
                        if (user.cart[l].id == items[j]._id.toString()) {
                          mycart[k].opt.push(user.cart[l]);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          res.json({ error: false, data: mycart });
        }
      }
    );
  }
});

module.exports = route;
