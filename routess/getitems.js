const express = require("express");
const route = express.Router();
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs").promises;

const items = require("../database/items");
const Shop = require("../database/shops");

let Random = [];
let data = [];
let the_items;

read();
async function read() {
  const data = await fs.readFile(
    path.join(__dirname, "..", "data", "data.txt")
  );
  the_items = parseInt(data.toString());
}

route.get("/getallitems", async (req, res) => {
  let multiplay;

  read();

  if (the_items < 10) multiplay = 10;
  else if (the_items < 100) multiplay = 100;
  else if (the_items < 1000) multiplay = 1000;
  else multiplay = 10000;
  for (let i = 0; i < 4; i++) {
    Random[i] = Math.trunc(Math.random() * multiplay);
    checknum(i, the_items, multiplay);
    data[i] = await items.findOne({ num: Random[i] });
    while (data[i] == null) {
      Random[i] = Math.trunc(Math.random() * multiplay);
      data[i] = await items.findOne({ num: Random[i] });
    }
    // console.log(data)
  }
  res.json({ error: false, data: data });
});

const checknum = function (i, min, multiplay) {
  while (Random[i] >= min) {
    Random[i] = Math.trunc(Math.random() * multiplay);
  }
  for (let j = 0; j < i; j++) {
    while (Random[i] === Random[j] || Random[i] >= min) {
      Random[i] = Math.trunc(Math.random() * multiplay);
    }
  }
};

async function read() {
  const data = await fs.readFile(
    path.join(__dirname, "..", "data", "data.txt")
  );
  the_items = parseInt(data.toString());
}

module.exports = route;
