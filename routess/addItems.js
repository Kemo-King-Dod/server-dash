const express = require("express");
const route = express.Router();
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs").promises;

const items = require("../database/items");
const Shop = require("../database/shops");

let the_items

read();
async function read() {
  const data = await fs.readFile(
    path.join(__dirname, "..", "data", "data.txt"),
  );
  the_items = parseInt(data.toString());
}

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, photo, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, photo, cb) {
    const uniqueSuffix = Date.now() + Math.round(Math.random());
    cb(null, uniqueSuffix + photo.originalname);
  },
});

const upload = multer({ storage });

route.post(
  "/additems",
  /* check , */ upload.array("image"),
  async (req, res) => {
    await jwt.verify(
      req.body.token,
      "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
      async (err, data) => {
        if (err) {
          res.status(403).json({
            error: true,
            data: "حدث خطأ",
          });
        }
        const item = {
          name: req.body.name,
          price: req.body.price,
          desc: req.body.desc,
          options: req.body.options,
          pictures: [],
          num: the_items,
        };
        for (let i = 0; i < req.files.length; i++) {
          item.pictures.push(req.files[i].filename);
        }
        const the_shop = await Shop.findOne({ _id: data.id })
        
        item.shopid = data.id;
        item.shop = the_shop.name
        
        await items.create(item);
        const the_item = await items.findOne({ num: the_items })
        await Shop.updateOne(
          { _id: data.id },
          { $push: { items: the_item._id } }
        );

        the_items++;
        await fs.writeFile(
          path.join(__dirname, "..", "data", "data.txt"),
          `${the_items}`
        );

        res.status(200).json({
          error: false,
          data: item,
        });
      }
    );
  }
);

route.post("/updateitem", async (req, res) => {
  console.log(req.body, "update");

  await jwt.verify(
    req.body.token,
    "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
    async (err, data) => {
      if (err) {
        res.status(403).json({
          error: true,
          data: "حدث خطأ",
        });
      } else {
        const item = await items.findByIdAndUpdate(req.body.id, {
          $set: {
            name: req.body.name,
            price: req.body.price,
            desc: req.body.desc,
            options: req.body.options,
          },
        });
        res.status(200).json({
          error: false,
          data: "تم التعديل بنجاح",
        });
      }
    }
  );
});
route.patch("/deleteitem", async (req, res) => {
  await jwt.verify(
    req.body.token,
    "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman",
    async (err, data) => {
      if (err) {
        res.status(403).json({
          error: true,
          data: "حدث خطأ",
        });
      } else {
        await items.findByIdAndDelete(req.body.id);
        res.status(200).json({
          error: false,
          data: "تم الحذف بنجاح",
        });
      }
    }
  );
});


module.exports = route;
