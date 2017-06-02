const express = require('express');
const bodyParser = require('body-parser');
const workshopsModel = require('../model/workshops.js');

const router = express.Router();

router.use(bodyParser.json());

// attendees
router.get('/dashboard/attendees/:w_id', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('Need to login (attendees).');
        err.status = 401;
        throw err;
    }
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('need workshop id (attendees).');
        err.status = 400;
        throw err;
    }

    workshopsModel.attendees(w_id, fb_id).then(attendees => {
        res.json(attendees);
    }).catch(next);
});

module.exports = router;
