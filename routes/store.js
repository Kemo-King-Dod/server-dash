const express = require("express");
const router = express.Router();
const User = require("../database/users");
const Ordre = require("../database/orders");
const Store = require("../database/store");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const bcrypt = require("bcrypt");
const Items = require("../database/items");
const deleteUploadedFile = require("../utils/deleteImage");

router.get("/getStore", auth, async (req, res) => {
  try {
    const id = req.userId;
    const store = await Store.findById(id, { password: 0, items: 0, rating: 0 });
    res.status(200).json({
      error: false,
      data: store,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});

router.get("/getStores", async (req, res) => {
  try {
    var id = null;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    }

    if (!req.headers.cityen) {
      return res.status(400).json({
        error: true,
        message: "يرجى التحقق من تفعيل الموقع وإعطاء الإذن",
      });
    }
    if (req.headers.cityen == "Alshaty" || req.headers.cityen == "East Alshaty") {
      req.headers.cityen = "Alshaty";
    }
    const stores = await Store.aggregate([
      { $match: { city: req.headers.cityen, registerCondition: "accepted" } },
      { $sample: { size: 10 } },
      { $project: { password: 0, items: 0, rating: 0 } }
    ]);

    // // Check if current time is between opening and closing times
    // for (let i = 0; i < stores.length; i++) {
    //   // Add isFavorite property to each item
    //   stores[i].isFollow = false;
    //   stores[i].isFavorite = false;

    //   // check openCondition

    //   const now = new Date();
    //   let hours = now.getHours();
    //   const minutes = now.getMinutes();

    //   // Parse store hours
    //   const openAMHour = parseInt(stores[i].opentimeam.split(":")[0]);
    //   const openAMMinute = parseInt(stores[i].opentimeam.split(":")[1]);
    //   const closeAMHour = parseInt(stores[i].closetimeam.split(":")[0]);
    //   const closeAMMinute = parseInt(stores[i].closetimeam.split(":")[1]);
    //   const openPMHour = parseInt(stores[i].opentimepm.split(":")[0]);
    //   const openPMMinute = parseInt(stores[i].opentimepm.split(":")[1]);
    //   let closePMHour = parseInt(stores[i].closetimepm.split(":")[0]);
    //   const closePMMinute = parseInt(stores[i].closetimepm.split(":")[1]);

    //   // Handle after-midnight closing times (e.g., 2:00 AM becomes 26:00)
    //   if (closePMHour < 7) {
    //     closePMHour += 24;
    //   }
    //   if (hours < 7) {
    //     if (closePMHour < 10) {
    //       hours += 24;
    //     }
    //   }

    //   // Convert current time to minutes for easier comparison
    //   // the server time is 2 hours late from libya that is way i added + 120
    //   const currentTimeInMinutes = hours * 60 + 120 + minutes;
    //   const openAMInMinutes = openAMHour * 60 + openAMMinute;
    //   const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
    //   const openPMInMinutes = openPMHour * 60 + openPMMinute;
    //   const closePMInMinutes = closePMHour * 60 + closePMMinute;

    //   // Check if current time falls within either AM or PM opening hours
    //   stores[i].openCondition =
    //     (currentTimeInMinutes >= openAMInMinutes &&
    //       currentTimeInMinutes <= closeAMInMinutes) ||
    //     (currentTimeInMinutes >= openPMInMinutes &&
    //       currentTimeInMinutes <= closePMInMinutes);
    //   stores[i].save();
    // }



    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      return res.status(200).json({
        error: false,
        data: stores,
      });
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < stores.length; i++) {
        for (var j = 0; j < user.favorateStors.length; j++) {
          if (user.favorateStors[j].toString() == stores[i]._id.toString()) {
            stores[i].isFavorite = true;
          }
        }
        for (var j = 0; j < user.followedStores.length; j++) {
          if (user.followedStores[j].toString() == stores[i]._id.toString()) {
            stores[i].isFollow = true;
          }
        }
      }
    }

    res.status(200).json({
      error: false,
      data: stores,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

router.post("/alterStorePassword", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const store = await Store.findById(userId);
    const valied = await bcrypt.compare(
      req.body.currentPassword,
      store.password
    );
    if (valied) {
      const salt = await bcrypt.genSalt(10);
      store.password = await bcrypt.hash(req.body.newPassword, salt);
      await store.save();
      res.status(200).json({
        error: false,
        message: "تم تحديث كلمة المرور بنجاح",
      });
    } else {
      res.status(401).json({
        error: true,
        message: "كلمة المرور الحالية غير صحيحة",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message,
    });
  }
});

// alter name
router.post("/alterStore", auth, async (req, res) => {
  try {
    let userId = req.userId;
    if (req.user.userType == "Admin") {
      userId = req.body.shopId;
    }
    const store = await Store.findById(userId);
    store.name = req.body.name;
    store.storeType = req.user.userType == "Admin" ? req.body.storeType : req.body.category;
    if (req.body.picture && store.picture !== req.body.picture) {
      await deleteUploadedFile(store.picture);
      store.picture = req.body.picture;
    }
    if (req.user.userType == "Admin") {
      store.phone = req.body.phone || store.phone;
      store.deliveryCostByKilo = req.body.deliveryCostByKilo || store.deliveryCostByKilo;
      store.ownerName = req.body.ownerName || store.ownerName;
      store.licenseNumber = req.body.licenseNumber || store.licenseNumber;
      store.address = req.body.address || store.address;
      store.city = req.body.city || store.city;
      store.location = req.body.location || store.location;
    }
    await store.save();

    await Ordre.updateMany(
      { "store.id": req.userId },
      {
        "store.name": req.body.name,
      }
    );

    res.status(200).json({
      error: false,
      message: "تم تحديث البيانات بنجاح",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});

router.post("/changeOpenTime", auth, async (req, res) => {
  try {
    const id = req.userId;
    const { closetimeam, closetimepm, opentimeam, opentimepm } = req.body;
    const store = await Store.findById(id, { password: 0, items: 0 });
    store.closetimeam = closetimeam;
    store.closetimepm = closetimepm;
    store.opentimeam = opentimeam;
    store.opentimepm = opentimepm;
    await store.save();
    res.status(200).json({
      error: false,
      data: {
        closetimeam,
        closetimepm,
        opentimeam,
        opentimepm,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});

router.post("/adminStoreState", auth, async (req, res) => {
  try {
    const { targetUserId, state } = req.body;

    // Find the store by ID
    const store = await Store.findById(targetUserId);

    if (!store) {
      return res.status(404).json({
        error: true,
        message: "المتجر غير موجود",
      });
    }

    // Update the store's registration condition
    store.registerCondition = state;
    await store.save();
    await Items.updateMany({ storeID: targetUserId }, { store_register_condition: state });

    res.status(200).json({
      error: false,
      message: "تم تحديث حالة المتجر بنجاح",
      data: {
        storeId: targetUserId,
        state: state,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message,
    });
  }
});

router.post("/isclosed", auth, async (req, res) => {
  try {
    const { storeId, isClosed } = req.body;
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: true, message: "store not found" });
    }
    store.isClosed = isClosed;
    await store.save();
    res
      .status(200)
      .json({ error: false, message: "store status updated" });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

module.exports = router;
