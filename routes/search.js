const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");

route.post("/search", async (req, res) => {
  try {
    var id = null;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    }

    const searchTerm = req.body.keyWord;

    if (!req.headers.cityen) {
      return res.status(400).json({
        error: false,
        message: "يرجى التحقق من تفعيل الموقع وإعطاء الإذن"
      });
    }
    const city = req.headers.cityen
    

    // Try text search first for stores
    // let allStores = await Store.aggregate([
    //     {
    //         $match: {
    //             $text: { $search: searchTerm }
    //         }
    //     },
    //     {
    //         $sort: {
    //             score: { $meta: "textScore" }
    //         }
    //     },
    //     {
    //         $limit: 2
    //     }
    // ]);

    // If no results, fall back to regex search for stores
    // if (allStores.length === 0) {
    let allStores = await Store.aggregate([
      {
        $match: {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
          city: city,
          registerCondition: "accepted",
        },
      },
      // {
      //   $limit: 2,
      // },
    ]);
    // }

    // Try text search first for items
    // let allItems = await items.aggregate([
    //     {
    //         $match: {
    //             $text: { $search: searchTerm }
    //         }
    //     },
    //     {
    //         $sort: {
    //             score: { $meta: "textScore" }
    //         }
    //     },
    //     {
    //         $limit: 4
    //     }
    // ]);

    // If no results, fall back to regex search for items
    // if (allItems.length === 0) {00
    let allItems = await items.aggregate([
      {
        $match: {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
          city: city,
          store_register_condition: "accepted",
        },
      },
      // {
      //   $limit: 4,
      // },
    ]);
    // }

    // Check if current time is between opening and closing times
    for (let i = 0; i < allStores.length; i++) {
      // Add isFavorite property to each item
      allStores[i].isFollow = false;
      allStores[i].isFavorite = false;

      // check openCondition
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();

      // Parse store hours
      const openAMHour = parseInt(allStores[i].opentimeam.split(":")[0]);
      const openAMMinute = parseInt(allStores[i].opentimeam.split(":")[1]);
      const closeAMHour = parseInt(allStores[i].closetimeam.split(":")[0]);
      const closeAMMinute = parseInt(allStores[i].closetimeam.split(":")[1]);
      const openPMHour = parseInt(allStores[i].opentimepm.split(":")[0]);
      const openPMMinute = parseInt(allStores[i].opentimepm.split(":")[1]);
      let closePMHour = parseInt(allStores[i].closetimepm.split(":")[0]);
      const closePMMinute = parseInt(allStores[i].closetimepm.split(":")[1]);

      // Handle after-midnight closing times (e.g., 2:00 AM becomes 26:00)
      if (closePMHour < 7) {
        closePMHour += 24;
      }
      if (hours < 7) {
        if (closePMHour < 10) {
          hours += 24;
        }
      }

      // Convert current time to minutes for easier comparison
      // the server time is 2 hours late from libya that is way i added + 120
      const currentTimeInMinutes = hours * 60 + 120 + minutes;
      const openAMInMinutes = openAMHour * 60 + openAMMinute;
      const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
      const openPMInMinutes = openPMHour * 60 + openPMMinute;
      const closePMInMinutes = closePMHour * 60 + closePMMinute;

      // Check if current time falls within either AM or PM opening hours
      allStores[i].openCondition =
        (currentTimeInMinutes >= openAMInMinutes &&
          currentTimeInMinutes <= closeAMInMinutes) ||
        (currentTimeInMinutes >= openPMInMinutes &&
          currentTimeInMinutes <= closePMInMinutes);
    }

    // Handle visitor case
    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      res.json({
        error: false,
        data: {
          products: allItems,
          stores: allStores,
        },
      });
      return;
    }

    // Handle authenticated user case
    // Add isFollow property to each store
    for (var i = 0; i < allStores.length; i++) {
      if (!allStores[i]) continue;
      allStores[i].isFollow = false;
      allStores[i].isFavorite = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < allStores.length; i++) {
        for (var j = 0; j < user.followedStores.length; j++) {
          if (user.followedStores[j] == allStores[i]._id) {
            allStores[i].isFollow = true;
          }
        }
      }
      // Add isFavorite property to stores
      // Update store favorites
      for (var i = 0; i < allStores.length; i++) {
        if (!allStores[i]) continue;
        for (var j = 0; j < user.favorateStors.length; j++) {
          if (!user.favorateStors[j]) continue;
          if (
            user.favorateStors[j]._id.toString() === allStores[i]._id.toString()
          ) {
            allStores[i].isFavorite = true;
          }
        }
      }

      // Add isFollow property to stores
      for (var i = 0; i < allStores.length; i++) {
        if (!allStores[i]) continue;
        allStores[i].isFollow = false;
        for (var j = 0; j < user.followedStores.length; j++) {
          if (
            user.followedStores[j].toString() == allStores[i]._id.toString()
          ) {
            allStores[i].isFollow = true;
          }
        }
      }

      // Add isFavorite property to items
      for (var i = 0; i < allItems.length; i++) {
        if (!allItems[i]) continue;
        allItems[i].isFavorite = false;
        for (var j = 0; j < user.favorateItems.length; j++) {
          if (!user.favorateItems[j]) continue;
          if (
            user.favorateItems[j]._id.toString() === allItems[i]._id.toString()
          ) {
            allItems[i].isFavorite = true;
          }
        }
      }

      // Add like property to items
      for (var i = 0; i < allItems.length; i++) {
        if (!allItems[i]) continue;
        allItems[i].like = false;
        for (var j = 0; j < user.likedItems.length; j++) {
          if (!user.likedItems[j]) continue;
          if (user.likedItems[j] == allItems[i]._id.toString()) {
            allItems[i].like = true;
          }
        }
      }
    }

     res.json({
      error: false,
      data: {
        products: allItems,
        stores: allStores,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

module.exports = route;
