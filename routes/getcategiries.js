const { error } = require("console");
const express = require("express");
const router = express.Router();
const path = require("path");


router.get('/categories', (req, res) => {
    try {
        const categiries = []
        categiries.push({
            name: 'أثاث',
            image: path.join('uploads','pictures','athath.avif')
        })
        categiries.push({
            name: 'مطاعم',
            image: path.join('uploads','pictures','bergar.avif')
        })
        categiries.push({
            name: 'ملابس',
            image: path.join('uploads','pictures','clothes.avif')
        })
        categiries.push({
            name: 'أدوات',
            image: path.join('uploads','pictures','tools.avif')
        })
        console.log(categiries)
        res.status(200).send({
            error: false,
            categories: categiries
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            error: true,
            message: err.message
        })
    }
})


module.exports = router