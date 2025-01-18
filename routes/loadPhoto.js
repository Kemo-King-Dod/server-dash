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
    const filetypes = /jpeg|jpg|png/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  }
})

app.post('/upload', auth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: true,
      path: 'No file uploaded.'
    })
  }
  res.json({
    error: false,
    path: req.file.path
  })
})

module.exports = app