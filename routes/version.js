const express = require('express');
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

module.exports = router;


