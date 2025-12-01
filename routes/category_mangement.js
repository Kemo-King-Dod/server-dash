const fs = require('fs');
const express = require('express')
const app = express()
const router = express.Router();
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'categories/')
  },
  filename: function (req, file, cb) {
    cb(null,  file.fieldname)
  }
})

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    try {
      const filetypes = /jpeg|jpg|png|bmp|webp|tiff|svg|heic|heif|raw|cr2|nef|arw|dng|psd|avif|jxr|hdr|exr/
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
      const mimetype = filetypes.test(file.mimetype)

      if (extname && mimetype) {
        return cb(null, true)
      }
      cb(new Error('Only image files are allowed!'))
    } catch (err) {
      console.log(err)
      res.status(400).json({
        error: true,
        path: 'لم يتم تحميل ملفات'
      })
    }
  }
})

router.post('/addCategory', upload.single('photo'), (req, res) => {
  try {
    if (!req.body.password || req.body.password !== 'Chackmate@9876') {
      return res.status(401).json({
        error: true,
        message: 'يجب إدخال كلمة المرور'
      })
    }
    if (!req.body.category) {
      return res.status(400).json({
        error: true,
        message: 'يجب إدخال الفئة'
      })
    }
    if (!req.file) {
      return res.status(400).json({
        error: true,
        path: 'لم يتم تحميل ملفات'
      })
    }

    const newCategory = {
      name: req.body.category.name,             // اسم الفئة من الفورم
      image: "/categories/" + req.file.filename  // مسار الصورة
    };
    // Read the current categories
    const categoriesPath = path.join(__dirname, "..", "utils", "categories.json");
    const currentCategories = require("../utils/categories.json");
    
    // Add the new category
    const updatedCategories = {
      avilableCat: [...currentCategories.avilableCat, newCategory]
    };

    // Write back to file
    fs.writeFileSync(categoriesPath, JSON.stringify(updatedCategories, null, 2));
    
    // Clear the require cache to get fresh data
    delete require.cache[require.resolve("../utils/categories.json")];
    
    res.status(200).json({ 
      error: false, 
      message: "Category added successfully", 
      path: path.join('categories', req.file.filename),
      avilableCat: updatedCategories.avilableCat 
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: true,
      message: err.message
    })
  }
})

router.post('/deleteCategory', (req, res) => {
  try {
    if (!req.body.password || req.body.password !== 'Chackmate@9876') {
      return res.status(401).json({
        error: true,
        message: 'يجب إدخال كلمة المرور'
      })
    }
    if (!req.body.category) {
      return res.status(400).json({
        error: true,
        message: 'يجب إدخال الفئة'
      })
    }
    const { category } = req.body;
    const categoriesPath = path.join(__dirname, "..", "utils", "categories.json");
    const currentCategories = require("../utils/categories.json");
    const updatedCategories = currentCategories.avilableCat.filter(cat => cat.name !== category);
    fs.writeFileSync(categoriesPath, JSON.stringify({ avilableCat: updatedCategories }, null, 2));
    delete require.cache[require.resolve("../utils/categories.json")];
    res.status(200).json({ error: false, message: "Category deleted successfully" });
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      error: true,
      message: err.message
    })
  }
})
router.post('/updateCategory',upload.single('photo'), (req, res) => {
  try {
    if (!req.body.password || req.body.password !== 'Chackmate@9876') {
      return res.status(401).json({
        error: true,
        message: 'يجب إدخال كلمة المرور'
      })
    }

    if (!req.body.category) {
      return res.status(400).json({
        error: true,
        message: 'يجب إدخال الفئة'
      })
    }
    const { category } = req.body;
    const categoriesPath = path.join(__dirname, "..", "utils", "categories.json");
    const currentCategories = require("../utils/categories.json");
    const updatedCategories = currentCategories.avilableCat.filter(cat => cat.name !== category);
    fs.writeFileSync(categoriesPath, JSON.stringify({ avilableCat: updatedCategories }, null, 2));
    delete require.cache[require.resolve("../utils/categories.json")];
    res.status(200).json({ error: false, message: "Category updated successfully" });
  }

  catch (err) {
    console.log(err)
    res.status(500).json({
      error: true,
      message: err.message
    })
  }
})
module.exports = router