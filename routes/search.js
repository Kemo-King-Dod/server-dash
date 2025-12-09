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

    // ✅ التحقق من المدينة
    if (!req.headers.cityen) {
      return res.status(400).json({
        error: false,
        message: "يرجى التحقق من تفعيل الموقع وإعطاء الإذن"
      });
    }

    const city = req.headers.cityen;

    // ✅ التحقق من وجود كلمة البحث
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        error: true,
        message: "يرجى إدخال كلمة البحث"
      });
    }

    // ✅ تنظيف كلمة البحث
    const cleanSearchTerm = searchTerm.trim();

    // ✅ إنشاء أنماط بحث مختلفة
    const exactPattern = `^${cleanSearchTerm}$`; // مطابقة تامة
    const startsWithPattern = `^${cleanSearchTerm}`; // تبدأ بـ
    const containsPattern = cleanSearchTerm; // تحتوي على
    const flexiblePattern = cleanSearchTerm.split('').join('.*'); // بحث مرن

    // ✅ تقسيم الكلمة لكلمات منفصلة
    const searchWords = cleanSearchTerm.split(/\s+/).filter(word => word.length > 0);

    // ==================== البحث في المتاجر ====================

    // المحاولة الأولى: استخدام Text Search (الأسرع)
    let allStores = await Store.aggregate([
      {
        $match: {
          $and: [
            { $text: { $search: cleanSearchTerm } },
            { city: city },
            { registerCondition: "accepted" }
          ]
        }
      },
      {
        $addFields: {
          textScore: { $meta: "textScore" },
          searchScore: 100
        }
      },
      {
        $sort: { textScore: -1 }
      }
    ]);

    // المحاولة الثانية: إذا لم نجد نتائج، استخدم Regex
    if (allStores.length === 0) {
      allStores = await Store.aggregate([
        {
          $match: {
            $and: [
              { city: city },
              { registerCondition: "accepted" },
              {
                $or: [
                  // 1. مطابقة تامة
                  { name: { $regex: exactPattern, $options: "i" } },
                  { storeType: { $regex: exactPattern, $options: "i" } },

                  // 2. تبدأ بالكلمة
                  { name: { $regex: startsWithPattern, $options: "i" } },
                  { storeType: { $regex: startsWithPattern, $options: "i" } },

                  // 3. تحتوي على الكلمة
                  { name: { $regex: containsPattern, $options: "i" } },
                  { discription: { $regex: containsPattern, $options: "i" } },
                  { storeType: { $regex: containsPattern, $options: "i" } },
                  { address: { $regex: containsPattern, $options: "i" } },

                  // 4. بحث مرن
                  { name: { $regex: flexiblePattern, $options: "i" } },

                  // 5. بحث في الكلمات المنفصلة
                  ...searchWords.map(word => ({
                    $or: [
                      { name: { $regex: word, $options: "i" } },
                      { storeType: { $regex: word, $options: "i" } },
                      { discription: { $regex: word, $options: "i" } }
                    ]
                  }))
                ]
              }
            ]
          }
        },
        {
          $addFields: {
            searchScore: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$name", regex: exactPattern, options: "i" } }, then: 100 },
                  { case: { $regexMatch: { input: "$storeType", regex: exactPattern, options: "i" } }, then: 95 },
                  { case: { $regexMatch: { input: "$name", regex: startsWithPattern, options: "i" } }, then: 80 },
                  { case: { $regexMatch: { input: "$storeType", regex: startsWithPattern, options: "i" } }, then: 75 },
                  { case: { $regexMatch: { input: "$name", regex: containsPattern, options: "i" } }, then: 60 },
                  { case: { $regexMatch: { input: "$discription", regex: containsPattern, options: "i" } }, then: 50 },
                  { case: { $regexMatch: { input: "$storeType", regex: containsPattern, options: "i" } }, then: 45 }
                ],
                default: 30
              }
            }
          }
        },
        {
          $addFields: {
            finalScore: {
              $add: [
                "$searchScore",
                { $multiply: [{ $ifNull: ["$rating", 0] }, 2] },
                { $divide: [{ $ifNull: ["$followersNumber", 0] }, 10] }
              ]
            }
          }
        },
        {
          $sort: {
            finalScore: -1,
            rating: -1,
            followersNumber: -1,
            name: 1
          }
        }
      ]);
    }

    // ==================== البحث في المنتجات ====================

    let allItems = await items.aggregate([
      {
        $match: {
          $and: [
            { $text: { $search: cleanSearchTerm } },
            { city: city },
            { store_register_condition: "accepted" }
          ]
        }
      },
      {
        $addFields: {
          textScore: { $meta: "textScore" },
          searchScore: 100
        }
      },
      {
        $sort: { textScore: -1 }
      }
    ]);

    if (allItems.length === 0) {
      allItems = await items.aggregate([
        {
          $match: {
            $and: [
              { city: city },
              { store_register_condition: "accepted" },
              {
                $or: [
                  { name: { $regex: exactPattern, $options: "i" } },
                  { category: { $regex: exactPattern, $options: "i" } },
                  { name: { $regex: startsWithPattern, $options: "i" } },
                  { category: { $regex: startsWithPattern, $options: "i" } },
                  { name: { $regex: containsPattern, $options: "i" } },
                  { description: { $regex: containsPattern, $options: "i" } },
                  { category: { $regex: containsPattern, $options: "i" } },
                  { storeName: { $regex: containsPattern, $options: "i" } },
                  { name: { $regex: flexiblePattern, $options: "i" } },
                  ...searchWords.map(word => ({
                    $or: [
                      { name: { $regex: word, $options: "i" } },
                      { description: { $regex: word, $options: "i" } },
                      { category: { $regex: word, $options: "i" } }
                    ]
                  }))
                ]
              }
            ]
          }
        },
        {
          $addFields: {
            searchScore: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$name", regex: exactPattern, options: "i" } }, then: 100 },
                  { case: { $regexMatch: { input: "$category", regex: exactPattern, options: "i" } }, then: 95 },
                  { case: { $regexMatch: { input: "$name", regex: startsWithPattern, options: "i" } }, then: 80 },
                  { case: { $regexMatch: { input: "$name", regex: containsPattern, options: "i" } }, then: 60 },
                  { case: { $regexMatch: { input: "$description", regex: containsPattern, options: "i" } }, then: 50 }
                ],
                default: 30
              }
            }
          }
        },
        {
          $addFields: {
            finalScore: {
              $add: [
                "$searchScore",
                { $divide: [{ $ifNull: ["$likes", 0] }, 5] }
              ]
            }
          }
        },
        {
          $sort: {
            finalScore: -1,
            likes: -1,
            name: 1
          }
        }
      ]);
    }

    // ✅ إزالة حقول النقاط من النتائج
    allStores = allStores.map(store => {
      const { searchScore, finalScore, textScore, ...rest } = store;
      return rest;
    });

    allItems = allItems.map(item => {
      const { searchScore, finalScore, textScore, ...rest } = item;
      return rest;
    });

    // // ==================== معالجة أوقات العمل للمتاجر ====================
    // for (let i = 0; i < allStores.length; i++) {
    //   allStores[i].isFollow = false;
    //   allStores[i].isFavorite = false;

    //   // التحقق من أوقات العمل
    //   if (allStores[i].opentimeam && allStores[i].closetimeam &&
    //     allStores[i].opentimepm && allStores[i].closetimepm) {

    //     const now = new Date();
    //     let hours = now.getHours();
    //     const minutes = now.getMinutes();

    //     const openAMHour = parseInt(allStores[i].opentimeam.split(":")[0]);
    //     const openAMMinute = parseInt(allStores[i].opentimeam.split(":")[1]);
    //     const closeAMHour = parseInt(allStores[i].closetimeam.split(":")[0]);
    //     const closeAMMinute = parseInt(allStores[i].closetimeam.split(":")[1]);
    //     const openPMHour = parseInt(allStores[i].opentimepm.split(":")[0]);
    //     const openPMMinute = parseInt(allStores[i].opentimepm.split(":")[1]);
    //     let closePMHour = parseInt(allStores[i].closetimepm.split(":")[0]);
    //     const closePMMinute = parseInt(allStores[i].closetimepm.split(":")[1]);

    //     if (closePMHour < 7) {
    //       closePMHour += 24;
    //     }
    //     if (hours < 7) {
    //       if (closePMHour < 10) {
    //         hours += 24;
    //       }
    //     }

    //     const currentTimeInMinutes = hours * 60 + 120 + minutes;
    //     const openAMInMinutes = openAMHour * 60 + openAMMinute;
    //     const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
    //     const openPMInMinutes = openPMHour * 60 + openPMMinute;
    //     const closePMInMinutes = closePMHour * 60 + closePMMinute;

    //     allStores[i].openCondition =
    //       (currentTimeInMinutes >= openAMInMinutes &&
    //         currentTimeInMinutes <= closeAMInMinutes) ||
    //       (currentTimeInMinutes >= openPMInMinutes &&
    //         currentTimeInMinutes <= closePMInMinutes);
    //   } else {
    //     allStores[i].openCondition = false;
    //   }
    // }

    // ==================== حالة الزائر ====================
    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      return res.json({
        error: false,
        data: {
          products: allItems,
          stores: allStores,
        },
      });
    }

    // ==================== حالة المستخدم المسجّل ====================
    if (id) {
      const user = await User.findOne({ _id: id });

      if (user) {
        // إضافة خاصية المتابعة للمتاجر
        for (var i = 0; i < allStores.length; i++) {
          if (!allStores[i]) continue;
          allStores[i].isFollow = false;
          for (var j = 0; j < user.followedStores.length; j++) {
            if (user.followedStores[j].toString() === allStores[i]._id.toString()) {
              allStores[i].isFollow = true;
              break;
            }
          }
        }

        // إضافة خاصية المفضلة للمتاجر
        for (var i = 0; i < allStores.length; i++) {
          if (!allStores[i]) continue;
          allStores[i].isFavorite = false;
          for (var j = 0; j < user.favorateStors.length; j++) {
            if (!user.favorateStors[j]) continue;
            if (user.favorateStors[j]._id.toString() === allStores[i]._id.toString()) {
              allStores[i].isFavorite = true;
              break;
            }
          }
        }

        // إضافة خاصية المفضلة للمنتجات
        for (var i = 0; i < allItems.length; i++) {
          if (!allItems[i]) continue;
          allItems[i].isFavorite = false;
          for (var j = 0; j < user.favorateItems.length; j++) {
            if (!user.favorateItems[j]) continue;
            if (user.favorateItems[j]._id.toString() === allItems[i]._id.toString()) {
              allItems[i].isFavorite = true;
              break;
            }
          }
        }

        // إضافة خاصية الإعجاب للمنتجات
        for (var i = 0; i < allItems.length; i++) {
          if (!allItems[i]) continue;
          allItems[i].like = false;
          for (var j = 0; j < user.likedItems.length; j++) {
            if (!user.likedItems[j]) continue;
            if (user.likedItems[j] == allItems[i]._id.toString()) {
              allItems[i].like = true;
              break;
            }
          }
        }
      }
    }

    // ✅ الرد النهائي
    res.json({
      error: false,
      data: {
        products: allItems,
        stores: allStores,
      },
    });

  } catch (error) {
    console.log("خطأ في البحث:", error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

module.exports = route;