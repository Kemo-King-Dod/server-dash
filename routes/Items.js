const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");
const { auth } = require("../middleware/auth");
const path = require("path");
const Retrenchments = require('../database/Retrenchments');
const getCityName = require("../utils/getCityName");
const { sendNotification, sendNotificationToTopic } = require("../firebase/notification")



let random = []
let data = []

// Add this helper function after the imports
const deleteUploadedFile = async (filePath) => {
  try {
    if (!filePath) return;
    await fs.unlink(path.join(__dirname, '..', filePath));
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

route.post("/additems", auth, async (req, res) => {
  try {
    const userId = req.userId
    const {
      name,
      price,
      gender,
      isActive,
      description,
      stock,
      options,
      addOns,
      imageUrl,
    } = req.body;

    const the_store = await Store.findById(userId)

    if (!the_store || the_store.registerCondition !== "accepted") {
      await deleteUploadedFile(imageUrl);
      console.log("غير مصرح");
      return res.status(403).json({
        error: true,
        operation: "addProduct",
        message: "غير مصرح",
      });
    }

    const item = {
      city: getCityName(the_store.location).englishName,
      storeName: the_store.name,
      storeImage: the_store.picture,
      name,
      price,
      description: description,
      options,
      gender,
      addOns,
      isActive,
      stock,
      category: the_store.storeType,
      imageUrl: imageUrl,
      storeID: the_store.id,
      store_register_condition: the_store.registerCondition,
      is_retrenchment: req.body.is_retrenchment || false,
      retrenchment_percent: req.body.retrenchment_percent || 0
    };

    const newItem = await items.create(item);
    await Store.updateOne(
      { _id: the_store.id },
      { $push: { items: newItem._id } }
    );

    res.status(200).json({
      error: false,
      operation: "addProduct",
      message: newItem,
    })

    sendNotificationToTopic({ topic: the_store._id.toString(), body: newItem.name, title: "تم إضافة منتج جديد" })

  } catch (error) {
    await deleteUploadedFile(req.body.imageUrl);
    console.log(error.message);
    res.status(500).json({
      error: true,
      operation: "addProduct",
      message: "حدث خطأ في السيرفر",
    });
  }
});

route.post("/updateItem", auth, async (req, res) => {
  try {
    const {
      name,
      price,
      gender,
      isActive,
      description,
      stock,
      options,
      addOns,
      imageUrl,
    } = req.body;
    console.log(req.body)
   
    const item = await items.findById(req.body.id);
    if(!item){
      return  res.status(200).json({
        error: true,
        operation: "editProduct",
        message: "حصل خطأ ما",
      });
    }

    // Only delete the old image if a new one is provided
    if (imageUrl && imageUrl.split("4000/")[1] !== item.imageUrl) {
      await deleteUploadedFile(item.imageUrl);
    }

    // Update the item with the new data
    await items.findByIdAndUpdate(req.body.id, {
      $set: {
        name,
        price,
        gender,
        description,
        stock,
        options,
        addOns,
        // Only update imageUrl if a new one is provided
        ...(imageUrl ? { imageUrl: imageUrl.includes('4000/') ? imageUrl.split("4000/")[1] : imageUrl } : {}),
        isActive,
      },
    });

    res.status(200).json({
      error: false,
      operation: "editProduct",
      message: "تم التعديل بنجاح",
    });
  } catch (error) {
    console.log(error.message);
    res.status(200).json({
      error: false,
      operation: "editProduct",
      message: error.message,
    });
  }
});
route.patch("/deleteitem", auth, async (req, res) => {
  try {
    const item = await items.findById(req.body.id);

    // حذف الصورة من الخادم إذا كانت موجودة
    if (item && item.imageUrl) {
      await deleteUploadedFile(item.imageUrl);
    }

    await items.findByIdAndDelete(req.body.id);

    // delete items from favorate

    res.status(200).json({
      error: false,
      operation: "deleteProduct",
      message: "تم الحذف بنجاح",
    });
  } catch (error) {
    console.log(error.message);
    res.status(200).json({
      error: false,
      operation: "deleteProduct",
      message: error.message,
    });
  }
});

route.get("/getAllItems", async (req, res) => {
  try {
    var id = null;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    }

    console.log(req.headers)
    if (!req.headers.cityen) {
      return res.status(400).json({
        error: false,
        message: "يرجى التحقق من تفعيل الموقع وإعطاء الإذن"
      });
    }

    let data
    // Get all available items
    if (id) {
      var user = await User.findById(id)
      if (user.gender)
        if (user.gender == 'male') {
          data = await items.aggregate([
            {
              $match: { gender: { $in: ['all', 'male'] }, city: { $in: [req.headers.cityen] },category:{$in:['مقهى','مطاعم','مواد غذائية']} }
            },
            {
              $sample: { size: 10 }
            }
          ])
        }
        else {
          data = await items.aggregate([
            {
              $match: { gender: { $in: ['all', 'female'] }, city: { $in: [req.headers.cityen] },category:{$in:['مقهى','مطاعم','مواد غذائية']}  }
            },
            {
              $sample: { size: 10 }
            }
          ])
        }
    }
    else {
      data = await items.aggregate([
        {
          $match: { gender: { $in: ['all'] }, city: { $in: [req.headers.cityen] } ,category:{$in:['مقهى','مطاعم','مواد غذائية']}  }
        },
        {
          $sample: { size: 10 }
        }
      ])
    }
    for (let i = 0; i < data.length; i++) {
      console.log(data[i].city)
    }

    let discoundIds = []

    for (let i = 0; i < data.length; i++) {
      if (data[i].retrenchment_end < Date.now()) {
        discoundIds.push(data[i]._id)
        data[i].retrenchment_end = null
        data[i].retrenchment_percent = null
        data[i].is_retrenchment = false
        await items.findByIdAndUpdate(data[i]._id, {
          $set: {
            retrenchment_end: null,
            retrenchment_percent: null,
            is_retrenchment: false
          }
        })
      }
    }

    // delete if retrenchment_end is bigger than or equl now
    Retrenchments.deleteMany(
      {
        retrenchment_end: { $lt: Date.now() },
      }
    )


    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      res.json({ error: false, items: data });
      return;
    }

    // Add isFavorite property to each item
    for (var i = 0; i < data.length; i++) {
      data[i].isFavorite = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < user.favorateItems.length; j++) {
          if (user.favorateItems[j] == null) continue;
          if (user.favorateItems[j].toString() == data[i]._id.toString()) {
            data[i].isFavorite = true;
          }
        }
      }
    }

    // Add like property to each item
    for (var i = 0; i < data.length; i++) {
      data[i].like = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < user.likedItems.length; j++) {
          if (user.likedItems[j] == null) continue;
          if (user.likedItems[j].toString() == data[i]._id.toString()) {
            data[i].like = true;
          }
        }
      }
    }

    res.json({ error: false, items: data });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

route.post("/getStoreItems", async (req, res) => {
  try {
    3
    var id = req.body.shopId;
    var userid = null;

    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = await jwt.verify(token, JWT_SECRET);
      userid = decoded.id;
    }

    const allItems = [];

    // Get Store
    const store = await Store.findOne({ _id: id });

    // Get all store items
    const theitems = [];
    for (let i = 0; i < store.items.length; i++) {
      theitems[i] = await items.findOne({ _id: store.items[i].toString() });
    }

    for (let i = 0; i < theitems.length; i++) {
      if (theitems[i]) allItems.push(theitems[i]);
    }

    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      res.json({ error: false, data: allItems });
      return;
    }

    // Add isFavorite property to each item
    for (var i = 0; i < allItems.length; i++) {
      allItems[i]._doc.isFavorite = false;
    }

    if (userid) {
      const user = await User.findOne({ _id: userid });
      for (var i = 0; i < allItems.length; i++) {
        for (var j = 0; j < user.favorateItems.length; j++) {
          if (user.favorateItems[j] == null) continue;
          if (
            user.favorateItems[j].toString() == allItems[i]._id.toString()
          ) {
            allItems[i]._doc.isFavorite = true;
          }
        }
      }
    }

    // Add like property to each item
    for (var i = 0; i < allItems.length; i++) {
      allItems[i]._doc.like = false;
    }

    if (userid) {
      const user = await User.findOne({ _id: userid });
      for (var i = 0; i < allItems.length; i++) {
        for (var j = 0; j < user.likedItems.length; j++) {
          if (user.likedItems[j] == null) continue;
          if (
            user.likedItems[j].toString() == allItems[i]._id.toString()
          ) {
            allItems[i]._doc.like = true;
          }
        }
      }
    }

    res.json({ error: false, data: allItems });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

route.get("/storeItems", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const allItems = [];

    // Get Store
    const store = await Store.findOne({ _id: userId });

    // Get all store items
    const theitems = [];
    for (let i = 0; i < store.items.length; i++) {
      theitems[i] = await items.findOne({ _id: store.items[i].toString() });
    }

    for (let i = 0; i < theitems.length; i++) {
      if (theitems[i]) allItems.push(theitems[i]);
    }

    res.json({ error: false, data: allItems });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

route.post("/category", async (req, res) => {
  try {
    console.log("req.body category",req.body)
    var id = null;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    }


    const storeMatch = {
      city: req.headers.cityen,
    };
    const itemsMatch = {
      city: req.headers.cityen,
    };
    
    if (req.body.category !== "all") {
      storeMatch.storeType = req.body.category;
      itemsMatch.category=req.body.category;
    }
    
    // الحصول على المتاجر
    const allStores = await Store.aggregate([
      { $match: storeMatch },
      { $sample: { size: 10 } }
    ]);
    const allItems = await items.aggregate([
      {
        $match: itemsMatch,
      },
      {
        $sample: { size: 10 }
      }
    ])

    // are you visitor 
    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      res.json({
        error: false, data: {
          products: allItems,
          stores: allStores
        }
      });
      return;
    }


    // you are not a visitor

    // favorite for stores
    // Add isFavorite property to each store
    for (var i = 0; i < allStores.length; i++) {
      allStores[i].isFavorite = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id })
      for (var i = 0; i < allStores.length; i++) {
        for (var j = 0; j < user.favorateStors.length; j++) {
          if (user.favorateStors[j] == null) continue;
          if (user.favorateStors[j].toString() == allStores[i]._id.toString()) {
            allStores[i].isFavorite = true;
          }
        }
      }
    }

    // Add isFollow property to each store
    for (var i = 0; i < allStores.length; i++) {
      allStores[i].isFollow = false;
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
    }


    // favorite for data
    // Add isFavorite property to each item
    for (var i = 0; i < allItems.length; i++) {
      allItems[i].isFavorite = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < allItems.length; i++) {
        for (var j = 0; j < user.favorateItems.length; j++) {
          if (user.favorateItems[j] == null) continue;
          if (user.favorateItems[j]._id.toString() == allItems[i]._id.toString()) {
            allItems[i].isFavorite = true;
          }
        }
      }
    }


    // Add like property to each item
    for (var i = 0; i < allItems.length; i++) {
      allItems[i].like = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < allItems.length; i++) {
        for (var j = 0; j < user.likedItems.length; j++) {
          if (user.likedItems[j] == null) continue;
          if (user.likedItems[j].toString() == allItems[i]._id.toString()) {
            allItems[i].like = true;
          }
        }
      }
    }

    res.json({
      error: false, data: {
        products: allItems,
        stores: allStores
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

module.exports = route