var express = require('express');
var router = express.Router();


router.get('/', (req, res) => {
    res.render('index');
});


router.get('/agreement', (req, res) => {
    res.render('agreement');
});


router.get('/privacy', (req, res) => {
    res.render('privacy');
});

module.exports = router;
