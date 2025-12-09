const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");

// ✅ دالة تطبيع النص العربي
function normalizeArabicText(text) {
  if (!text) return "";

  return text
    // إزالة التشكيل
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // توحيد الهمزات
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, 'ه')
    // إزالة المسافات الزائدة
    .trim()
    .toLowerCase();
}

// ✅ دالة لتوليد أشكال مختلفة من الكلمة
function generateArabicVariations(word) {
  const normalized = normalizeArabicText(word);
  const original = word.trim();
  const variations = new Set([normalized, original]);

  // === معالجة نهايات الكلمات ===
  
  // نهايات ى/ي/ه/ة
  const endings = ['ى', 'ي', 'ه', 'ة'];
  endings.forEach(ending => {
    if (normalized.endsWith(ending)) {
      const base = normalized.slice(0, -1);
      endings.forEach(e => variations.add(base + e));
    }
  });

  // === معالجة الجمع والمفرد ===
  
  // Case 1: مقاهي → مقهى
  // إذا كانت تحتوي على 'ا' قبل آخر حرفين، احذفها
  if (normalized.length > 3) {
    const lastTwo = normalized.slice(-2);
    const beforeLastTwo = normalized.slice(0, -2);
    
    if (beforeLastTwo.includes('ا')) {
      // حذف آخر 'ا' في الكلمة
      const lastAIndex = beforeLastTwo.lastIndexOf('ا');
      const withoutA = beforeLastTwo.slice(0, lastAIndex) + beforeLastTwo.slice(lastAIndex + 1);
      
      // توليد جميع الأشكال
      endings.forEach(ending => {
        variations.add(withoutA + ending);
        variations.add(withoutA + lastTwo.charAt(0) + ending);
      });
    }
  }
  
  // Case 2: مقهى → مقاهي
  // إضافة 'ا' قبل آخر حرف
  if (normalized.length > 2 && !normalized.slice(0, -1).endsWith('ا')) {
    const base = normalized.slice(0, -1);
    const lastChar = normalized.slice(-1);
    
    endings.forEach(ending => {
      variations.add(base + 'ا' + lastChar.replace(/[ىيهة]/, '') + ending);
      variations.add(base.slice(0, -1) + 'ا' + base.slice(-1) + ending);
    });
  }

  // === معالجة ألف ولام التعريف ===
  
  const currentVariations = Array.from(variations);
  currentVariations.forEach(v => {
    if (v.startsWith('ال')) {
      variations.add(v.substring(2));
    } else {
      variations.add('ال' + v);
    }
  });

  // === إضافة أشكال إضافية للكلمات الشائعة ===
  
  const commonPatterns = {
    'مقاهي': ['مقهى', 'مقهي', 'مقهه', 'مقاهى'],
    'مقهى': ['مقاهي', 'مقهي', 'مقهه'],
    'مطاعم': ['مطعم', 'مطعمة'],
    'مطعم': ['مطاعم', 'مطعمة'],
    'محلات': ['محل', 'محله'],
    'محل': ['محلات', 'محله'],
  };
  
  const normalizedLower = normalized.toLowerCase();
  Object.keys(commonPatterns).forEach(key => {
    if (normalizedLower.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedLower)) {
      commonPatterns[key].forEach(variant => variations.add(variant));
    }
  });

  const result = Array.from(variations).filter(v => v && v.length > 0);
  return result;
}
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

    // ✅ تنظيف وتطبيع كلمة البحث
    const cleanSearchTerm = searchTerm.trim();
    const normalizedSearch = normalizeArabicText(cleanSearchTerm);

    // ✅ Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ✅ توليد أشكال مختلفة من الكلمة
    const searchVariations = generateArabicVariations(cleanSearchTerm);

    // 🔍 Debug: طباعة الأشكال المولدة
    console.log('🔍 كلمة البحث الأصلية:', cleanSearchTerm);
    console.log('🔍 الكلمة المطبّعة:', normalizedSearch);
    console.log('🔍 جميع الأشكال المولدة:', searchVariations);

    // ✅ إنشاء أنماط بحث للكلمة الأصلية والمطبّعة
    const createPatterns = (term) => {
      const escaped = escapeRegex(term);
      return {
        exact: `^${escaped}$`,
        startsWith: `^${escaped}`,
        contains: escaped,
        flexible: escaped.split('').join('.*')
      };
    };

    const originalPatterns = createPatterns(cleanSearchTerm);
    const normalizedPatterns = createPatterns(normalizedSearch);

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
                // 1. مطابقة تامة - النص الأصلي
                { name: { $regex: originalPatterns.exact, $options: "i" } },
                { storeType: { $regex: originalPatterns.exact, $options: "i" } },

                // 2. مطابقة تامة - النص المطبّع
                { name: { $regex: normalizedPatterns.exact, $options: "i" } },
                { storeType: { $regex: normalizedPatterns.exact, $options: "i" } },

                // 3. البحث في جميع الأشكال المختلفة للكلمة
                ...searchVariations.map(variation => {
                  const escaped = escapeRegex(variation);
                  return {
                    $or: [
                      { name: { $regex: escaped, $options: "i" } },
                      { storeType: { $regex: escaped, $options: "i" } },
                      { discription: { $regex: escaped, $options: "i" } }
                    ]
                  };
                }),

                // 4. تبدأ بالكلمة
                { name: { $regex: originalPatterns.startsWith, $options: "i" } },
                { storeType: { $regex: originalPatterns.startsWith, $options: "i" } },
                { name: { $regex: normalizedPatterns.startsWith, $options: "i" } },
                { storeType: { $regex: normalizedPatterns.startsWith, $options: "i" } },

                // 5. تحتوي على الكلمة
                { name: { $regex: originalPatterns.contains, $options: "i" } },
                { discription: { $regex: originalPatterns.contains, $options: "i" } },
                { storeType: { $regex: originalPatterns.contains, $options: "i" } },
                { address: { $regex: originalPatterns.contains, $options: "i" } },
                { name: { $regex: normalizedPatterns.contains, $options: "i" } },
                { storeType: { $regex: normalizedPatterns.contains, $options: "i" } },

                // 6. بحث مرن
                { name: { $regex: originalPatterns.flexible, $options: "i" } },
                { name: { $regex: normalizedPatterns.flexible, $options: "i" } },

                // 7. بحث في الكلمات المنفصلة
                ...searchWords.map(word => {
                  const normalizedWord = normalizeArabicText(word);
                  const escapedWord = escapeRegex(word);
                  const escapedNormalized = escapeRegex(normalizedWord);
                  return {
                    $or: [
                      { name: { $regex: escapedWord, $options: "i" } },
                      { storeType: { $regex: escapedWord, $options: "i" } },
                      { discription: { $regex: escapedWord, $options: "i" } },
                      { name: { $regex: escapedNormalized, $options: "i" } },
                      { storeType: { $regex: escapedNormalized, $options: "i" } }
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
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.exact, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.exact, options: "i" } }
                    ]
                  },
                  then: 100
                },
                // مطابقة تامة للنوع = 95 نقطة
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$storeType", regex: originalPatterns.exact, options: "i" } },
                      { $regexMatch: { input: "$storeType", regex: normalizedPatterns.exact, options: "i" } }
                    ]
                  },
                  then: 95
                },
                // يبدأ بالكلمة في الاسم = 80 نقطة
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.startsWith, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.startsWith, options: "i" } }
                    ]
                  },
                  then: 80
                },
                // يبدأ بالكلمة في النوع = 75 نقطة
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$storeType", regex: originalPatterns.startsWith, options: "i" } },
                      { $regexMatch: { input: "$storeType", regex: normalizedPatterns.startsWith, options: "i" } }
                    ]
                  },
                  then: 75
                },
                // يحتوي على الكلمة في الاسم = 60 نقطة
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.contains, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.contains, options: "i" } }
                    ]
                  },
                  then: 60
                },
                // يحتوي على الكلمة في الوصف = 50 نقطة
                {
                  case: {
                    $and: [
                      { $ne: ["$discription", null] },
                      {
                        $or: [
                          { $regexMatch: { input: "$discription", regex: originalPatterns.contains, options: "i" } },
                          { $regexMatch: { input: "$discription", regex: normalizedPatterns.contains, options: "i" } }
                        ]
                      }
                    ]
                  },
                  then: 50
                },
                // يحتوي على الكلمة في النوع = 45 نقطة
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$storeType", regex: originalPatterns.contains, options: "i" } },
                      { $regexMatch: { input: "$storeType", regex: normalizedPatterns.contains, options: "i" } }
                    ]
                  },
                  then: 45
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
                { name: { $regex: originalPatterns.exact, $options: "i" } },
                { category: { $regex: originalPatterns.exact, $options: "i" } },
                { name: { $regex: normalizedPatterns.exact, $options: "i" } },
                { category: { $regex: normalizedPatterns.exact, $options: "i" } },

                // 2. البحث في الأشكال المختلفة
                ...searchVariations.map(variation => {
                  const escaped = escapeRegex(variation);
                  return {
                    $or: [
                      { name: { $regex: escaped, $options: "i" } },
                      { category: { $regex: escaped, $options: "i" } },
                      { description: { $regex: escaped, $options: "i" } }
                    ]
                  };
                }),

                // 3. تبدأ بالكلمة
                { name: { $regex: originalPatterns.startsWith, $options: "i" } },
                { category: { $regex: originalPatterns.startsWith, $options: "i" } },
                { name: { $regex: normalizedPatterns.startsWith, $options: "i" } },

                // 4. تحتوي على الكلمة
                { name: { $regex: originalPatterns.contains, $options: "i" } },
                { description: { $regex: originalPatterns.contains, $options: "i" } },
                { category: { $regex: originalPatterns.contains, $options: "i" } },
                { storeName: { $regex: originalPatterns.contains, $options: "i" } },
                { name: { $regex: normalizedPatterns.contains, $options: "i" } },

                // 5. بحث مرن
                { name: { $regex: originalPatterns.flexible, $options: "i" } },
                { name: { $regex: normalizedPatterns.flexible, $options: "i" } },

                // 6. بحث في الكلمات المنفصلة
                ...searchWords.map(word => {
                  const normalizedWord = normalizeArabicText(word);
                  const escapedWord = escapeRegex(word);
                  const escapedNormalized = escapeRegex(normalizedWord);
                  return {
                    $or: [
                      { name: { $regex: escapedWord, $options: "i" } },
                      { description: { $regex: escapedWord, $options: "i" } },
                      { category: { $regex: escapedWord, $options: "i" } },
                      { name: { $regex: escapedNormalized, $options: "i" } },
                      { category: { $regex: escapedNormalized, $options: "i" } }
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
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.exact, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.exact, options: "i" } }
                    ]
                  },
                  then: 100
                },
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$category", regex: originalPatterns.exact, options: "i" } },
                      { $regexMatch: { input: "$category", regex: normalizedPatterns.exact, options: "i" } }
                    ]
                  },
                  then: 95
                },
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.startsWith, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.startsWith, options: "i" } }
                    ]
                  },
                  then: 80
                },
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$name", regex: originalPatterns.contains, options: "i" } },
                      { $regexMatch: { input: "$name", regex: normalizedPatterns.contains, options: "i" } }
                    ]
                  },
                  then: 60
                },
                {
                  case: {
                    $and: [
                      { $ne: ["$description", null] },
                      {
                        $or: [
                          { $regexMatch: { input: "$description", regex: originalPatterns.contains, options: "i" } },
                          { $regexMatch: { input: "$description", regex: normalizedPatterns.contains, options: "i" } }
                        ]
                      }
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