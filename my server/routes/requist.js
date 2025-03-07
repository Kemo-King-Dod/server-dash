const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../database/users");
const Shop = require("../database/shops")
const Order = require("../database/orders");
const Item = require("../database/items");
const path = require("path")
const webPush = require("web-push");


route.post("/requist", async (req, res) => {
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

          const order = [];
          for (let i = 0; i < user.cart.length; i++) {
            if (user.cart[i].shopid == req.body.shopid) {
              order.push(user.cart[i]);
            }
          }
          for (let i = 0; i < user.cart.length; i++) {
            if (user.cart[i].shopid == req.body.shopid) {
              await User.updateOne(
                { _id: data.id },
                { $pull: { cart: { shopid: req.body.shopid } } }
              );
            }
          }
          let t = 0;
          for (let i = 0; i < order.length; i++) {
            const item = await Item.findOne({ _id: order[i].id });
            t += item.price;
          }
          const the_order = {
            shopid: req.body.shopid,
            location: req.body.location,
            items: order,
            total: t.toString(),
            status: "جاري التوجيه",
            distenationPrice: "",
            driver: "",
          };
          await User.updateOne(
            { _id: data.id },
            {
              $push: {
                orders: the_order,
              },
            }
          );
          Order.create(the_order);
          // socket io send

          const k = await User.findOne({ _id: data.id });
          res.json({ error: false, data: { user }, id: req.body.shopid, order: order});
        }
      }
    );
  }
});


module.exports = route;
