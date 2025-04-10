const express = require('express');
const router = express.Router();
const version = require('../utils/version.json');

router.get('/getVersion', async (req, res) => {
    res.status(200).json({
        error: false,
        message: "Version fetched successfully",
        data:version
    });
});

module.exports = router;


