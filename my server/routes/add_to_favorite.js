const express = require('express')
const route = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../database/users')
const item = require('../database/items')




route.post('/addtofavorite', async (req, res) => {
    console.log(req.body);
    if (req.body.token) {
        await jwt.verify(req.body.token, 'Our_Electric_Websight_In_#Sebha2024_Kamal_&_Sliman',
            async (err, data) => {
                if (err) {
                    res.status(403).json({
                        error: true,
                        data: 'يرجى تسجيل الدخول'
                    })
                    res.end()
                }
                else {
                    if (req.body.isFavorite == true)
                        await User.updateOne({ _id: data.id }, { $push: { favorite: req.body.id } })
                    else 
                    await User.updateOne({ _id: data.id }, { $pull: { favorite: req.body.id } })
                    res.json({hello:"hello world!"})
                }
            })
    }
})

route.post('/get_from_favorite', async (req, res) => {
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
              res.json({ error: false, data: user.favorite });
            }
          }
        );
      }
})

module.exports = route