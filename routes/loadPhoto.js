const express = require('express')
const app = express()
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log(req.file)
    console.log(file)
    const filetypes = /jpeg|jpg|png/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  }
})

app.post('/upload', upload.single('photo'), (req, res) => {
  console.log('reatch ')
  console.log(req.file)
  if(!req.body.password || req.body.password !== 'Chackmate@9876') {
    return res.status(401).json({
      error: true,
      message: 'يجب إدخال كلمة المرور'
    })
  }
  if (!req.file) {
    return res.status(400).json({
      error: true,
      path: 'لم يتم تحميل ملفات'
    })
  }
  res.json({
    error: false,
    path: req.file.path
  })
})

module.exports = app