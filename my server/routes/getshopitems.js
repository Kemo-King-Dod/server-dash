const express = require("express");
const route = express.Router();
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs").promises;

const items = require("../database/items");
const Shop = require("../database/shops");

let the_items = 0;

route.post("/getshopitems", async (req, res) => {
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
       const item = await items.find({shopid: data.id})
        res.status(200).json({
          error: false,
          data: item,
        });
      }
    }
  );
});

route.get("/getitems", async (req, res) => {
  await items.find();

  res.status(200).json({
    error: false,
    data: items,
  });
});

module.exports = route;
