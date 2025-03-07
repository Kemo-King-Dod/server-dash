const express = require("express");
const route = express.Router();
const bcrypt = require("bcrypt");
const User = require("../database/users");

const jwt = require("jsonwebtoken");

const sign = function (id) {
  return jwt.sign({ id }, "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman");
};

route.post("/addlocation", async (req, res) => {
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
          let exist = await User.findOne({_id: data.id});
          if (!exist) {
            res.json({ error: true, data: "ليس هناك متاجر" });
          } else {
            const user = await User.updateOne(
              {
                _id: exist._id,
              },
              {
                $push: {
                  location: req.body.location,
                },
              }
            );
            res.json({ error: false, data: "done" });
          }
        }
      }
    );
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

route.post("/addl", async (req, res) => {
    console.log(req.bodylocation)
  let exist = await User.findOne({_id: req.body.id});
  if (!exist) {
    res.json({ error: true, data: "ليس هناك متاجر" });
  } else {
    const user = await User.updateOne(
      {
        _id: exist._id,
      },
      {
        $push: {
          location: req.body.location,
        },
      }
    );
    res.json({ error: false, data: "done" });
  }
});

route.post("/getl", async (req, res) => {
  const user = await User.findOne({ _id: req.body.id });
  res.json({ error: false, data: user.location });
});

module.exports = route;
