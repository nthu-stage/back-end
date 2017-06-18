const express = require('express');
const bodyParser = require('body-parser');
const newsModel = require('../model/news.js');

const router = express.Router();

router.use(bodyParser.json());

const url = '/news';

// list
router.get(url, function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('Not a corret ID for Login or Register');
        err.status = 401;
        throw err;
    }
    newsModel
        .list(fb_id)
        .then(news => { res.json(news); })
        .catch(next);
});

module.exports = router;
