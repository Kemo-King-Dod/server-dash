const express = require("express");
const route = express.Router();
const Shop = require("../database/shops");
const jwt = require("jsonwebtoken");
const path = require("path");

const sign = function (id) {
  return jwt.sign({ id }, "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman");
};

route.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "view.html"));
});

route.get("/showwaitingshops", async (req, res) => {
  const exist = await Shop.find({ condition: "waiting" });
  if (exist.length == 0) {
    res.send({
      error: true,
      waitingshops: "null"
    })
  } else {
    res.status(200).send({error: false, waitingshops:exist })
  }
});

module.exports = route;