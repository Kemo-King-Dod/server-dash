const express = require("express");
const route = express.Router();

route.get('/getCitiesAndVersion', async (req, res) => {
    try {
        res.status(200).json({
            error: false,
            data: { citiesAndBoundry: require('./cities.json'), version: require("./version.json") }
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
})

module.exports = route