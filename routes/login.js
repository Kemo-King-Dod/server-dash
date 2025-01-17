const express = require("express")
const route = express.Router()
const bcrypt = require("bcrypt")
const Store = require("../database/store")

const sign = function (id) {
  return jwt.sign({ id }, "Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman");
};

route.post("/login", async (req, res) => {
  let exist = await Store.findOne({ phone: req.body.phone });
  if (!exist) exist = await User.findOne({ phone: req.body.phone });
  if (!exist) exist = await Driver.findOne({ phone: req.body.phone });
  if (!exist) {
    res.send({
      error: true,
      data: " رقم الهاتف غير موجود",
    })
  } else {
    const valid = await bcrypt.compare(req.body.password, exist.password);
    if (!valid) {
      res.send({
        error: true,
        data: "كلمة المرور غير صحيحة",
      })
    } else {
      let user;
      if (exist.userType == "Store")
        user = {
          condition: exist.condition,
          userType: exist.userType,
        }
      else if (exist.userType == "Driver")
        user = {
          userType: exist.userType,
        }
      else
        user = {
          userType: exist.userType,
        }
      const data = sign(exist._id);
      res.status(200).send({ error: false, token: data, user });
    }
  }
});


module.exports = route