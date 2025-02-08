const { error } = require("console");
const express = require("express");
const router = express.Router();
const path = require("path");


router.get('/categories', (req, res) => {
    try {
        const categiries = []
        categiries.push({
            name: 'athath.avif',
            Image: path.join(__dirname,'..','data','pictures','athath.avif')
        })
        categiries.push({
            name: 'bergar.avif',
            Image: path.join(__dirname,'..','data','pictures','bergar.avif')
        })
        categiries.push({
            name: 'clothes.avif',
            Image: path.join(__dirname,'..','data','pictures','clothes.avif')
        })
        categiries.push({
            name: 'tools.avif',
            Image: path.join(__dirname,'..','data','pictures','tools.avif')
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