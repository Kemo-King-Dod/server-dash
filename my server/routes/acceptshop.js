const express = require("express");
const route = express.Router();
const Shop = require("../database/shops");
const path = require("path");

route.post("/acceptshop", async (req, res) => {
  const exist = await Shop.updateOne(
    { phone: req.body.phone },
    { $set: { condition: "accepte" } }
  );
});

route.get("/shops", async (req, res) => {
  const exist = await Shop.find({ condition: "accepte" })
  if (exist) {
    res.json(exist)
  }
});

route.post("/declineshop", async (req, res) => {
  const exist = await Shop.updateOne(
    { phone: req.body.phone },
    { $set: { condition: "decline" } }
  );
});

module.exports = route;
