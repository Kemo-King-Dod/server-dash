const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");
const categories = require("../utils/categories.json");

// ==================== 🎯 قاموس مرادفات ومصطلحات شامل ====================
const SEMANTIC_DICTIONARY = {
  // مطاعم وأطعمة
  'مطعم': ['مطاعم', 'مطعمه', 'ريستورانت', 'restaurant', 'مأكولات', 'اكل', 'طعام', 'وجبات'],
  'برجر': ['برغر', 'همبرغر', 'همبرجر', 'بيرجر', 'برقر', 'burger', 'هامبورجر', 'ساندويتش'],
  'بيتزا': ['بيزا', 'pizza', 'فطيرة', 'فطائر'],
  'شاورما': ['شورما', 'شاورمه', 'شاورمة', 'shawarma', 'شورمه'],
  'فلافل': ['طعمية', 'فلافل', 'falafel'],
  'كشري': ['كشرى', 'كشري', 'koshari'],
  
  // مقاهي ومشروبات
  'قهوة': ['قهوه', 'كافيه', 'كافي', 'cafe', 'coffee', 'كوفي', 'قهاوي'],
  'مقهى': ['مقهي', 'مقهه', 'مقاهي', 'كافيه', 'كافي', 'cafe', 'coffee shop', 'كوفي شوب'],
  'شاي': ['تشاي', 'tea', 'شاى'],
  'عصير': ['عصائر', 'juice', 'عصيرات', 'مشروب', 'مشروبات'],
  'كابتشينو': ['كابوتشينو', 'cappuccino', 'كابتشينو'],
  'اسبريسو': ['اسبرسو', 'espresso', 'إسبريسو'],
  
  // خضروات وفواكه
  'خضار': ['خضروات', 'خضار وفواكه', 'خضراوات', 'خضره', 'vegetables', 'خضرة'],
  'فواكه': ['فاكهة', 'فاكهه', 'فواكة', 'fruits', 'ثمار', 'فواكهه'],
  'طماطم': ['طماطة', 'بندورة', 'طماط', 'tomato'],
  'بطاطس': ['بطاطا', 'potato', 'بطاطه'],
  'موز': ['banana', 'الموز'],
  'تفاح': ['تفاحة', 'apple', 'تفاحه'],
  
  // محلات ومتاجر
  'محل': ['محلات', 'متجر', 'متاجر', 'shop', 'store', 'محله', 'دكان', 'دكاكين'],
  'سوق': ['أسواق', 'اسواق', 'market', 'ماركت', 'سوبر ماركت', 'supermarket'],
  'مول': ['مجمع', 'mall', 'مركز تسوق'],
  
  // مواد غذائية
  'غذائية': ['غذائيه', 'مواد غذائية', 'غذاء', 'تموينات', 'بقالة', 'بقاله', 'grocery'],
  'لحم': ['لحوم', 'لحمة', 'meat', 'لحمه'],
  'دجاج': ['فراخ', 'chicken', 'دجاجة'],
  'سمك': ['اسماك', 'أسماك', 'fish', 'سمكة'],
  'حليب': ['لبن', 'milk', 'ألبان', 'البان'],
  'خبز': ['bread', 'عيش', 'خبزة'],
  
  // إلكترونيات وأجهزة
  'موبايل': ['جوال', 'هاتف', 'تلفون', 'phone', 'mobile', 'محمول'],
  'كمبيوتر': ['حاسوب', 'لابتوب', 'computer', 'laptop', 'كومبيوتر', 'حاسب', 'PC'],
  'تابلت': ['tablet', 'لوحي', 'ايباد', 'ipad'],
  'سماعة': ['سماعات', 'headphone', 'earphone', 'ايربودز', 'airpods'],
  'شاشة': ['شاشات', 'monitor', 'display', 'تلفزيون', 'تلفاز', 'TV'],
  
  // قطع غيار وإكسسوارات
  'اكسسوار': ['اكسسوارات', 'accessories', 'اكسسوار', 'إكسسوار', 'اكسسوارت'],
  'كفر': ['كفرات', 'جراب', 'case', 'حافظة'],
  'شاحن': ['شواحن', 'charger', 'شحن'],
  'سلك': ['كابل', 'cable', 'أسلاك', 'اسلاك'],
  
  // قرطاسية ومكتبية
  'قرطاسية': ['قرطاسيه', 'مكتبية', 'مكتبيه', 'stationery', 'ادوات مكتبية', 'أدوات مكتبية'],
  'دفتر': ['دفاتر', 'notebook', 'كراسة', 'كراسات'],
  'قلم': ['أقلام', 'اقلام', 'pen', 'pencil', 'قلمة'],
  'كتاب': ['كتب', 'book', 'books'],
  
  // ملابس وأحذية
  'ملابس': ['لبس', 'ثياب', 'clothes', 'هدوم', 'البسة'],
  'قميص': ['قمصان', 'shirt', 'تيشرت', 't-shirt'],
  'بنطلون': ['بنطال', 'pants', 'جينز', 'jeans', 'بنطرون'],
  'حذاء': ['أحذية', 'احذيه', 'shoes', 'جزمة'],
  
  // تجميل وعناية
  'تجميل': ['مكياج', 'makeup', 'كوزمتك', 'cosmetics', 'زينة', 'زينه'],
  'عطر': ['عطور', 'perfume', 'عطورات'],
  'شامبو': ['shampoo', 'شامبوهات'],
  'صابون': ['soap', 'صابونة'],
  
  // تنظيف ومنظفات
  'تنظيف': ['منظفات', 'مواد تنظيف', 'نظافة', 'منظف', 'cleaning', 'تنظيفات'],
  'منظف': ['منظفات', 'cleaner', 'مطهر'],
  'مسحوق': ['مساحيق', 'powder', 'غسيل'],
  
  // سيارات وقطع غيار
  'سيارة': ['سيارات', 'عربية', 'car', 'cars', 'عربيه'],
  'قطع غيار': ['قطع', 'غيار', 'spare parts', 'قطع سيارات'],
  'زيت': ['زيوت', 'oil', 'زيت محرك'],
  'اطار': ['إطارات', 'اطارات', 'كفر', 'tire', 'كاوتش'],
  
  // أدوات منزلية
  'أدوات': ['ادوات', 'tools', 'معدات'],
  'طبق': ['أطباق', 'اطباق', 'plate', 'صحن'],
  'كوب': ['أكواب', 'اكواب', 'cup', 'glass'],
  
  // حلويات ومخبوزات
  'حلويات': ['حلوى', 'حلو', 'sweets', 'dessert', 'حلاوة'],
  'كيك': ['كعكة', 'cake', 'كعك', 'تورتة'],
  'شوكولاته': ['شوكولاتة', 'شوكلت', 'chocolate', 'شوكولا'],
  'بسكويت': ['بسكوت', 'biscuit', 'cookies'],
  
  // صيدليات وأدوية
  'صيدلية': ['صيدليه', 'pharmacy', 'دواء', 'ادوية', 'أدوية'],
  'دواء': ['ادوية', 'أدوية', 'medicine', 'علاج'],
  
  // رياضة ولياقة
  'رياضة': ['رياضيه', 'sports', 'جيم', 'gym', 'نادي'],
  'نادي': ['نوادي', 'club', 'gym', 'جيم'],
  
  // مجوهرات وذهب
  'ذهب': ['مجوهرات', 'gold', 'ذهبيات', 'حلي'],
  'فضة': ['silver', 'فضيات'],
  
  // ورود وهدايا
  'ورد': ['ورود', 'زهور', 'flowers', 'زهره', 'زهرة'],
  'هدية': ['هدايا', 'gift', 'gifts', 'هديه'],
  
  // أثاث ومفروشات
  'أثاث': ['اثاث', 'furniture', 'عفش', 'مفروشات'],
  'كنب': ['كنبة', 'sofa', 'أريكة', 'اريكه'],
  
  // أجهزة منزلية
  'ثلاجة': ['ثلاجات', 'fridge', 'refrigerator', 'براد'],
  'غسالة': ['غسالات', 'washing machine', 'غساله'],
  'مكيف': ['مكيفات', 'AC', 'air conditioner', 'تكييف'],
  
  // كلمات عامة ومفيدة
  'جديد': ['حديث', 'new', 'جدد'],
  'قديم': ['مستعمل', 'used', 'second hand'],
  'رخيص': ['رخص', 'cheap', 'سعر منخفض'],
  'غالي': ['غالى', 'expensive', 'سعر مرتفع'],
  'عرض': ['عروض', 'offer', 'تخفيض', 'خصم', 'تخفيضات'],
};

// ==================== 📚 قاموس الأخطاء الإملائية الشائعة ====================
const TYPO_CORRECTIONS = {
  'مقاهى': 'مقاهي',
  'قهوه': 'قهوة',
  'مطاعمة': 'مطاعم',
  'بيزا': 'بيتزا',
  'كمبيوتر': 'كومبيوتر',
  'موبايل': 'جوال',
  'اكسسوار': 'إكسسوار',
  'خضراوات': 'خضروات',
  'فواكة': 'فواكه',
  'مكتبيه': 'مكتبية',
  'قرطاسيه': 'قرطاسية',
};

// ==================== 🔄 دالة Levenshtein Distance لحساب التشابه ====================
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

// ==================== 🎯 دالة حساب نسبة التشابه ====================
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1, str2);
  return 1.0 - distance / maxLen;
}

// ==================== ✨ دالة تطبيع النص العربي المحسّنة ====================
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
    // توحيد الواو
    .replace(/ؤ/g, 'و')
    // توحيد الهمزة على الياء
    .replace(/ئ/g, 'ي')
    // إزالة المسافات الزائدة
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// ==================== 🔍 دالة استخراج المرادفات والكلمات ذات الصلة ====================
function getSemanticVariations(word) {
  const normalized = normalizeArabicText(word);
  const variations = new Set();
  
  variations.add(word);
  variations.add(normalized);
  
  // البحث في قاموس المرادفات
  Object.keys(SEMANTIC_DICTIONARY).forEach(key => {
    const normalizedKey = normalizeArabicText(key);
    
    // إذا كانت الكلمة تطابق المفتاح أو أحد مرادفاته
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      variations.add(key);
      SEMANTIC_DICTIONARY[key].forEach(synonym => {
        variations.add(synonym);
        variations.add(normalizeArabicText(synonym));
      });
    }
    
    // البحث في المرادفات
    SEMANTIC_DICTIONARY[key].forEach(synonym => {
      const normalizedSynonym = normalizeArabicText(synonym);
      if (normalized.includes(normalizedSynonym) || normalizedSynonym.includes(normalized)) {
        variations.add(key);
        variations.add(synonym);
        SEMANTIC_DICTIONARY[key].forEach(s => variations.add(s));
      }
    });
    
    // البحث بالتشابه (similarity > 0.85)
    const similarity = similarityScore(normalized, normalizedKey);
    if (similarity > 0.85) {
      variations.add(key);
      SEMANTIC_DICTIONARY[key].forEach(s => variations.add(s));
    }
  });
  
  // البحث في الفئات من categories.json
  if (categories && categories.avilableCat) {
    categories.avilableCat.forEach(cat => {
      const catName = normalizeArabicText(cat.name);
      if (normalized.includes(catName) || catName.includes(normalized)) {
        variations.add(cat.name);
        variations.add(catName);
      }
      
      const similarity = similarityScore(normalized, catName);
      if (similarity > 0.8) {
        variations.add(cat.name);
      }
    });
  }
  
  return Array.from(variations).filter(v => v && v.length > 0);
}

// ==================== 🚀 دالة توليد أشكال مختلفة من الكلمة - النسخة المحسّنة ====================
function generateArabicVariations(word) {
  const normalized = normalizeArabicText(word);
  const original = word.trim();
  const variations = new Set([normalized, original]);

  // 1. معالجة الأخطاء الإملائية الشائعة
  if (TYPO_CORRECTIONS[normalized]) {
    variations.add(TYPO_CORRECTIONS[normalized]);
  }

  // 2. معالجة نهايات الكلمات
  const endings = ['ى', 'ي', 'ه', 'ة', 'ا'];
  endings.forEach(ending => {
    if (normalized.endsWith(ending)) {
      const base = normalized.slice(0, -1);
      endings.forEach(e => {
        variations.add(base + e);
        variations.add(base);
      });
    }
  });

  // 3. معالجة الجمع والمفرد
  if (normalized.length > 3) {
    const lastTwo = normalized.slice(-2);
    const beforeLastTwo = normalized.slice(0, -2);
    
    if (beforeLastTwo.includes('ا')) {
      const lastAIndex = beforeLastTwo.lastIndexOf('ا');
      const withoutA = beforeLastTwo.slice(0, lastAIndex) + beforeLastTwo.slice(lastAIndex + 1);
      
      endings.forEach(ending => {
        variations.add(withoutA + ending);
        variations.add(withoutA + lastTwo.charAt(0) + ending);
        variations.add(withoutA + lastTwo);
      });
    }
  }
  
  if (normalized.length > 2 && !normalized.slice(0, -1).endsWith('ا')) {
    const base = normalized.slice(0, -1);
    const lastChar = normalized.slice(-1);
    
    endings.forEach(ending => {
      variations.add(base + 'ا' + lastChar.replace(/[ىيهة]/, '') + ending);
      variations.add(base.slice(0, -1) + 'ا' + base.slice(-1) + ending);
    });
  }

  // 4. معالجة ألف ولام التعريف
  const currentVariations = Array.from(variations);
  currentVariations.forEach(v => {
    if (v.startsWith('ال')) {
      variations.add(v.substring(2));
    } else {
      variations.add('ال' + v);
    }
  });

  // 5. إضافة أنماط الجمع الشائعة
  const pluralPatterns = {
    'ات': '', // مطاعمات → مطاعم
    'ين': '', // مطاعمين → مطاعم
    'ون': '', // مطعمون → مطعم
  };
  
  Object.keys(pluralPatterns).forEach(pattern => {
    if (normalized.endsWith(pattern)) {
      const singular = normalized.slice(0, -pattern.length);
      variations.add(singular);
      endings.forEach(e => variations.add(singular + e));
    } else {
      variations.add(normalized + pattern);
    }
  });

  // 6. معالجة الحروف المتشابهة صوتياً
  const phoneticVariations = normalized
    .replace(/س/g, 'ص')
    .replace(/ذ/g, 'ز')
    .replace(/ض/g, 'د')
    .replace(/ظ/g, 'ز');
  
  if (phoneticVariations !== normalized) {
    variations.add(phoneticVariations);
  }

  // 7. الأشكال الشائعة المخصصة
  const commonPatterns = {
    'مقاهي': ['مقهى', 'مقهي', 'مقهه', 'مقاهى', 'كافيه', 'كافي', 'قهوة'],
    'مقهى': ['مقاهي', 'مقهي', 'مقهه', 'كافيه', 'كافي'],
    'مطاعم': ['مطعم', 'مطعمة', 'ريستورانت', 'مأكولات'],
    'مطعم': ['مطاعم', 'مطعمة', 'ريستورانت'],
    'محلات': ['محل', 'محله', 'متجر', 'دكان'],
    'محل': ['محلات', 'محله', 'متجر', 'دكان'],
    'خضار': ['خضروات', 'خضراوات', 'خضره', 'خضرة'],
    'فواكه': ['فاكهة', 'فواكة', 'فاكهه', 'ثمار'],
    'موبايل': ['جوال', 'هاتف', 'تلفون', 'محمول'],
    'كمبيوتر': ['حاسوب', 'لابتوب', 'حاسب', 'كومبيوتر'],
  };
  
  const normalizedLower = normalized.toLowerCase();
  Object.keys(commonPatterns).forEach(key => {
    const keyLower = normalizeArabicText(key);
    if (normalizedLower.includes(keyLower) || keyLower.includes(normalizedLower)) {
      commonPatterns[key].forEach(variant => {
        variations.add(variant);
        variations.add(normalizeArabicText(variant));
      });
    }
  });

  const result = Array.from(variations).filter(v => v && v.length > 0);
  return result;
}

// ==================== 🎨 دالة البحث الذكي المتقدم ====================
function generateAdvancedSearchTerms(searchTerm) {
  const allTerms = new Set();
  
  // 1. الكلمة الأصلية وتطبيعها
  allTerms.add(searchTerm);
  allTerms.add(normalizeArabicText(searchTerm));
  
  // 2. توليد الأشكال المختلفة
  const variations = generateArabicVariations(searchTerm);
  variations.forEach(v => allTerms.add(v));
  
  // 3. المرادفات الدلالية
  const semanticVars = getSemanticVariations(searchTerm);
  semanticVars.forEach(v => allTerms.add(v));
  
  // 4. تقسيم الكلمات المركبة
  const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
  words.forEach(word => {
    allTerms.add(word);
    allTerms.add(normalizeArabicText(word));
    generateArabicVariations(word).forEach(v => allTerms.add(v));
    getSemanticVariations(word).forEach(v => allTerms.add(v));
  });
  
  return Array.from(allTerms).filter(t => t && t.length > 0);
}

// ==================== 🔥 البحث الأسطوري الرئيسي ====================
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

    // 🚀 توليد جميع مصطلحات البحث المتقدمة
    const allSearchTerms = generateAdvancedSearchTerms(cleanSearchTerm);

    // ✅ Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 🔍 Debug: طباعة معلومات البحث
    console.log('🔍 كلمة البحث الأصلية:', cleanSearchTerm);
    console.log('🔍 الكلمة المطبّعة:', normalizedSearch);
    console.log('🔍 عدد المصطلحات المولدة:', allSearchTerms.length);
    console.log('🔍 أول 20 مصطلح:', allSearchTerms.slice(0, 20));

    // ✅ إنشاء أنماط بحث متعددة
    const createPatterns = (term) => {
      const escaped = escapeRegex(term);
      return {
        exact: `^${escaped}$`,
        startsWith: `^${escaped}`,
        endsWith: `${escaped}$`,
        contains: escaped,
        flexible: escaped.split('').join('.*'),
        wordBoundary: `\\b${escaped}\\b`
      };
    };

    // ==================== 🏪 البحث في المتاجر ====================

    // بناء شروط البحث الديناميكية
    const storeSearchConditions = [];
    
    allSearchTerms.forEach(term => {
      const patterns = createPatterns(term);
      storeSearchConditions.push(
        { name: { $regex: patterns.exact, $options: "i" } },
        { storeType: { $regex: patterns.exact, $options: "i" } },
        { name: { $regex: patterns.startsWith, $options: "i" } },
        { storeType: { $regex: patterns.startsWith, $options: "i" } },
        { name: { $regex: patterns.contains, $options: "i" } },
        { storeType: { $regex: patterns.contains, $options: "i" } },
        { discription: { $regex: patterns.contains, $options: "i" } },
        { address: { $regex: patterns.contains, $options: "i" } },
        { name: { $regex: patterns.wordBoundary, $options: "i" } },
        { storeType: { $regex: patterns.wordBoundary, $options: "i" } }
      );
    });

    let allStores = await Store.aggregate([
      {
        $match: {
          $and: [
            { city: city },
            { registerCondition: "accepted" },
            { $or: storeSearchConditions }
          ]
        }
      },
      {
        $addFields: {
          searchScore: {
            $let: {
              vars: {
                nameScore: {
                  $cond: {
                    if: { $regexMatch: { input: "$name", regex: escapeRegex(normalizedSearch), options: "i" } },
                    then: 100,
                    else: 0
                  }
                },
                typeScore: {
                  $cond: {
                    if: { $regexMatch: { input: "$storeType", regex: escapeRegex(normalizedSearch), options: "i" } },
                    then: 95,
                    else: 0
                  }
                },
                descScore: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ["$discription", null] },
                        { $regexMatch: { input: "$discription", regex: escapeRegex(normalizedSearch), options: "i" } }
                      ]
                    },
                    then: 50,
                    else: 0
                  }
                }
              },
              in: {
                $max: ["$$nameScore", "$$typeScore", "$$descScore"]
              }
            }
          },
          // حساب نقاط إضافية بناءً على التشابه
          relevanceBoost: {
            $cond: {
              if: { $gte: [{ $strLenCP: "$name" }, 1] },
              then: 10,
              else: 0
            }
          }
        }
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              "$searchScore",
              "$relevanceBoost",
              { $multiply: [{ $ifNull: ["$rating", 0] }, 3] },
              { $divide: [{ $ifNull: ["$followersNumber", 0] }, 10] },
              { $cond: [{ $eq: ["$openCondition", true] }, 15, 0] }
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
          finalScore: 0,
          relevanceBoost: 0
        }
      }
    ]);

    // ==================== 🛍️ البحث في المنتجات ====================

    const itemSearchConditions = [];
    
    allSearchTerms.forEach(term => {
      const patterns = createPatterns(term);
      itemSearchConditions.push(
        { name: { $regex: patterns.exact, $options: "i" } },
        { category: { $regex: patterns.exact, $options: "i" } },
        { name: { $regex: patterns.startsWith, $options: "i" } },
        { category: { $regex: patterns.startsWith, $options: "i" } },
        { name: { $regex: patterns.contains, $options: "i" } },
        { category: { $regex: patterns.contains, $options: "i" } },
        { description: { $regex: patterns.contains, $options: "i" } },
        { storeName: { $regex: patterns.contains, $options: "i" } },
        { name: { $regex: patterns.wordBoundary, $options: "i" } },
        { category: { $regex: patterns.wordBoundary, $options: "i" } }
      );
    });

    let allItems = await items.aggregate([
      {
        $match: {
          $and: [
            { city: city },
            { store_register_condition: "accepted" },
            { $or: itemSearchConditions }
          ]
        }
      },
      {
        $addFields: {
          searchScore: {
            $let: {
              vars: {
                nameScore: {
                  $cond: {
                    if: { $regexMatch: { input: "$name", regex: escapeRegex(normalizedSearch), options: "i" } },
                    then: 100,
                    else: 0
                  }
                },
                categoryScore: {
                  $cond: {
                    if: { $regexMatch: { input: "$category", regex: escapeRegex(normalizedSearch), options: "i" } },
                    then: 90,
                    else: 0
                  }
                },
                descScore: {
                  $cond: {
                    if: { 
                      $and: [
                        { $ne: ["$description", null] },
                        { $regexMatch: { input: "$description", regex: escapeRegex(normalizedSearch), options: "i" } }
                      ]
                    },
                    then: 45,
                    else: 0
                  }
                }
              },
              in: {
                $max: ["$$nameScore", "$$categoryScore", "$$descScore"]
              }
            }
          }
        }
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              "$searchScore",
              { $divide: [{ $ifNull: ["$likes", 0] }, 5] },
              { $cond: [{ $eq: ["$available", true] }, 10, 0] }
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

    // ==================== ⏰ معالجة أوقات العمل للمتاجر ====================
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

    // ==================== 👤 حالة الزائر ====================
    if (req.headers.isvisiter && req.headers.isvisiter == "true") {
      console.log(`✅ نتائج البحث: ${allStores.length} متجر، ${allItems.length} منتج`);
      return res.json({
        error: false,
        data: {
          products: allItems,
          stores: allStores,
          searchTermsGenerated: allSearchTerms.length
        },
      });
    }

    // ==================== 🔐 حالة المستخدم المسجّل ====================
    if (id) {
      const user = await User.findOne({ _id: id });

      if (user) {
        // معالجة حالة المتابعة للمتاجر
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

        // معالجة المفضلة للمتاجر
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

        // معالجة المفضلة للمنتجات
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

        // معالجة الإعجاب للمنتجات
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

    console.log(`✅ نتائج البحث النهائية: ${allStores.length} متجر، ${allItems.length} منتج`);

    res.json({
      error: false,
      data: {
        products: allItems,
        stores: allStores,
        searchTermsGenerated: allSearchTerms.length
      },
    });

  } catch (error) {
    console.log("❌ خطأ في البحث:", error);
    res.status(401).json({
      error: true,
      message: error.message,
    });
  }
});

module.exports = route;
