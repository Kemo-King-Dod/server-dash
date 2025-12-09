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

    // ✅ Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedTerm = escapeRegex(cleanSearchTerm);

    // ✅ إنشاء أنماط بحث مختلفة
    const exactPattern = `^${escapedTerm}$`; // مطابقة تامة
    const startsWithPattern = `^${escapedTerm}`; // تبدأ بـ
    const containsPattern = escapedTerm; // تحتوي على
    const flexiblePattern = escapedTerm.split('').join('.*'); // بحث مرن

    // ✅ تقسيم الكلمة لكلمات منفصلة
    const searchWords = cleanSearchTerm.split(/\s+/).filter(word => word.length > 0);

    // ==================== البحث في المتاجر ====================

    let allStores = await Store.aggregate([
      {
        $match: {
          $and: [
            { city: city },
            { registerCondition: "accepted" },
            {
              $or: [
                // 1. مطابقة تامة (أعلى أولوية)
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

                // 4. بحث مرن (أحرف متباعدة)
                { name: { $regex: flexiblePattern, $options: "i" } },

                // 5. بحث في الكلمات المنفصلة
                ...searchWords.map(word => {
                  const escapedWord = escapeRegex(word);
                  return {
                    $or: [
                      { name: { $regex: escapedWord, $options: "i" } },
                      { storeType: { $regex: escapedWord, $options: "i" } },
                      { discription: { $regex: escapedWord, $options: "i" } }
                    ]
                  };
                })
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
                // مطابقة تامة للاسم = 100 نقطة
                {
                  case: { $regexMatch: { input: "$name", regex: exactPattern, options: "i" } },
                  then: 100
                },
                // مطابقة تامة للنوع = 95 نقطة
                {
                  case: { $regexMatch: { input: "$storeType", regex: exactPattern, options: "i" } },
                  then: 95
                },
                // يبدأ بالكلمة في الاسم = 80 نقطة
                {
                  case: { $regexMatch: { input: "$name", regex: startsWithPattern, options: "i" } },
                  then: 80
                },
                // يبدأ بالكلمة في النوع = 75 نقطة
                {
                  case: { $regexMatch: { input: "$storeType", regex: startsWithPattern, options: "i" } },
                  then: 75
                },
                // يحتوي على الكلمة في الاسم = 60 نقطة
                {
                  case: { $regexMatch: { input: "$name", regex: containsPattern, options: "i" } },
                  then: 60
                },
                // يحتوي على الكلمة في الوصف = 50 نقطة
                {
                  case: {
                    $and: [
                      { $ne: ["$discription", null] },
                      { $regexMatch: { input: "$discription", regex: containsPattern, options: "i" } }
                    ]
                  },
                  then: 50
                },
                // يحتوي على الكلمة في النوع = 45 نقطة
                {
                  case: { $regexMatch: { input: "$storeType", regex: containsPattern, options: "i" } },
                  then: 45
                }
              ],
              default: 30 // أي تطابق آخر = 30 نقطة
            }
          }
        }
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              "$searchScore",
              { $multiply: [{ $ifNull: ["$rating", 0] }, 2] }, // نقاط التقييم
              { $divide: [{ $ifNull: ["$followersNumber", 0] }, 10] } // نقاط المتابعين
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
      },
      {
        $project: {
          searchScore: 0,
          finalScore: 0
        }
      }
    ]);

    // ==================== البحث في المنتجات ====================

    let allItems = await items.aggregate([
      {
        $match: {
          $and: [
            { city: city },
            { store_register_condition: "accepted" },
            {
              $or: [
                // 1. مطابقة تامة
                { name: { $regex: exactPattern, $options: "i" } },
                { category: { $regex: exactPattern, $options: "i" } },

                // 2. تبدأ بالكلمة
                { name: { $regex: startsWithPattern, $options: "i" } },
                { category: { $regex: startsWithPattern, $options: "i" } },

                // 3. تحتوي على الكلمة
                { name: { $regex: containsPattern, $options: "i" } },
                { description: { $regex: containsPattern, $options: "i" } },
                { category: { $regex: containsPattern, $options: "i" } },
                { storeName: { $regex: containsPattern, $options: "i" } },

                // 4. بحث مرن
                { name: { $regex: flexiblePattern, $options: "i" } },

                // 5. بحث في الكلمات المنفصلة
                ...searchWords.map(word => {
                  const escapedWord = escapeRegex(word);
                  return {
                    $or: [
                      { name: { $regex: escapedWord, $options: "i" } },
                      { description: { $regex: escapedWord, $options: "i" } },
                      { category: { $regex: escapedWord, $options: "i" } }
                    ]
                  };
                })
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
                {
                  case: { $regexMatch: { input: "$name", regex: exactPattern, options: "i" } },
                  then: 100
                },
                {
                  case: { $regexMatch: { input: "$category", regex: exactPattern, options: "i" } },
                  then: 95
                },
                {
                  case: { $regexMatch: { input: "$name", regex: startsWithPattern, options: "i" } },
                  then: 80
                },
                {
                  case: { $regexMatch: { input: "$name", regex: containsPattern, options: "i" } },
                  then: 60
                },
                {
                  case: {
                    $and: [
                      { $ne: ["$description", null] },
                      { $regexMatch: { input: "$description", regex: containsPattern, options: "i" } }
                    ]
                  },
                  then: 50
                }
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
              { $divide: [{ $ifNull: ["$likes", 0] }, 5] } // نقاط الإعجابات
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
      },
      {
        $project: {
          searchScore: 0,
          finalScore: 0
        }
      }
    ]);

    // ==================== معالجة أوقات العمل للمتاجر ====================
    for (let i = 0; i < allStores.length; i++) {
      allStores[i].isFollow = false;
      allStores[i].isFavorite = false;

      // التحقق من أوقات العمل
      if (allStores[i].opentimeam && allStores[i].closetimeam &&
        allStores[i].opentimepm && allStores[i].closetimepm) {

        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();

        const openAMHour = parseInt(allStores[i].opentimeam.split(":")[0]);
        const openAMMinute = parseInt(allStores[i].opentimeam.split(":")[1]);
        const closeAMHour = parseInt(allStores[i].closetimeam.split(":")[0]);
        const closeAMMinute = parseInt(allStores[i].closetimeam.split(":")[1]);
        const openPMHour = parseInt(allStores[i].opentimepm.split(":")[0]);
        const openPMMinute = parseInt(allStores[i].opentimepm.split(":")[1]);
        let closePMHour = parseInt(allStores[i].closetimepm.split(":")[0]);
        const closePMMinute = parseInt(allStores[i].closetimepm.split(":")[1]);

        if (closePMHour < 7) {
          closePMHour += 24;
        }
        if (hours < 7) {
          if (closePMHour < 10) {
            hours += 24;
          }
        }

        const currentTimeInMinutes = hours * 60 + 120 + minutes;
        const openAMInMinutes = openAMHour * 60 + openAMMinute;
        const closeAMInMinutes = closeAMHour * 60 + closeAMMinute;
        const openPMInMinutes = openPMHour * 60 + openPMMinute;
        const closePMInMinutes = closePMHour * 60 + closePMMinute;

        allStores[i].openCondition =
          (currentTimeInMinutes >= openAMInMinutes &&
            currentTimeInMinutes <= closeAMInMinutes) ||
          (currentTimeInMinutes >= openPMInMinutes &&
            currentTimeInMinutes <= closePMInMinutes);
      } else {
        allStores[i].openCondition = false;
      }
    }

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

module.exports = route