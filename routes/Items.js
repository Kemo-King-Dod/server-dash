const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");
const { auth } = require("../middleware/auth");
const path = require("path");

let random = []
let data = []

// Add this helper function after the imports
const deleteUploadedFile = async (filePath) => {
  try {
    if (!filePath) return;
    await fs.unlink(path.join('http://178.16.130.89:4000/', filePath));
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
    });
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
    await deleteUploadedFile(item.imageUrl);
    await items.findByIdAndUpdate(req.body.id, {
      $set: {
        name: name,
        price: price,
        gender: gender,
        description: description,
        stock: stock,
        options: options,
        addOns: addOns,
        imageUrl: imageUrl.split("4000/")[1],
        isActive: isActive,
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
    await items.findByIdAndDelete(req.body.id);
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



    // Get all available items
    if (id) {
      var user = await User.findById(id)
      let data
      if (user.gender == 'male') {
        data = await items.aggregate([
          {
            $match: { gender: { $in: ['all', 'male'] } }
          },
          {
            $sample: { size: 4 }
          }
        ])
      }
      else {
        data = await items.aggregate([
          {
            $match: { gender: { $in: ['all', 'female'] } }
          },
          {
            $sample: { size: 4 }
          }
        ])
      }
    }
    else {
      data = await items.aggregate([
        {
          $match: { gender: { $in: ['all'] } }
        },
        {
          $sample: { size: 4 }
        }
      ])
    }


    for (let i = 0; i < data.length; i++) {
      var itemStore = await Store.findById(data[i].storeID);
      data[i].storeName = itemStore.name;
      data[i].storeImage = itemStore.picture;
    }

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
          if (user.favorateItems[j]._id.toString() == data[i]._id.toString()) {
            data[i].isFavorite = true;
          }
        }
      }
    }

    res.json({ error: false, items: data });
  } catch (error) {
    console.log(error.message);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

route.post("/getStoreItems", async (req, res) => {
  try {
    var id = req.body.id;
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
            user.favorateItems[j]._id.toString() == allItems[i]._id.toString()
          ) {
            allItems[i]._doc.isFavorite = true;
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
    var id = null;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    }



    // Get all available items
    const allStores = await Store.aggregate([
      {
        $match: { storeType: req.body.category }
      },
      {
        $sample: { size: 2 }
      }
    ])
    const allItems = await items.aggregate([
      {
        $match: { category: req.body.category }
      },
      {
        $sample: { size: 2 }
      }
    ])

    // add store name and image to the items
    for (let i = 0; i < allItems.length; i++) {
      var itemStore = await Store.findById(allItems[i].storeID);
      allItems[i].storeName = itemStore.name;
      allItems[i].storeImage = itemStore.picture;
    }

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
    // Add isFavorite property to each item
    for (var i = 0; i < allStores.length; i++) {
      allStores[i].isFavorite = false;
    }

    if (id) {
      const user = await User.findOne({ _id: id });
      for (var i = 0; i < allStores.length; i++) {
        for (var j = 0; j < user.favorateStors.length; j++) {
          if (favorateStors[j] == null) continue;
          if (user.favorateStors[j]._id.toString() == allStores[i]._id.toString()) {
            allStores[i].isFavorite = true;
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