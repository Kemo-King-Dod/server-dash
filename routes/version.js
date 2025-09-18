const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/getVersion', async (req, res) => {
    var version = require('../utils/version.json');
    version.image = path.join('uploads','pictures',version.image);
    res.status(200).json({
        error: false,
        message: "Version fetched successfully",
        data:version
    });
});

router.get('/getVersionForDriver', async (req, res) => {
    var version = require('../utils/versionDriver.json');
    version.image = path.join('uploads','pictures',version.image);
    res.status(200).json({
        error: false,
        message: "Version fetched successfully",
        data:version
    });
});

router.get('/getVersionForQueue', async (req, res) => {
    var version = require('../utils/queueVersion.json');
    version.image = path.join('uploads','pictures',version.image);
    res.status(200).json({
        error: false,
        message: "Version fetched successfully",
        data:version
    });
});

module.exports = router;

