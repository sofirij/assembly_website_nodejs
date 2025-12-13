// single route to serve the static files
const express = require('express');
const router = express.Router();

router.route('/')
    .get((req, res) => {
        res.sendFile(__dirname + '/../../../dist/index.html');
    })

module.exports = router;