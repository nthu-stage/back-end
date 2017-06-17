const express = require('express');
const bodyParser = require('body-parser');
const profilesModel = require('../model/profiles.js');
const ideasModel = require('../model/ideas.js');
const workshopsModel = require('../model/workshops.js');

const fn = require('../fn.js');

const router = express.Router();

router.use(bodyParser.json());

// list
router.get('/workshops', function(req, res, next) {
    const {searchText, stateFilter, start} = req.query;

    workshopsModel
        .list(searchText, stateFilter, start)
        .then(workshops => { res.json(workshops); })
        .catch(next);
});

// show
router.get('/workshops/:w_id', function(req, res, next) {
    var fb_id = req.get('userID');
    if (fb_id === undefined) {
        fb_id = null;
    }
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('workshop ID required. (show)');
        err.status = 400;
        throw err;
    }

    workshopsModel
        .show(w_id, fb_id)
        .then(workshop => { res.json(workshop); })
        .catch(next);
});


// propose
router.post('/workshops', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('You need to login. (propose)');
        err.status = 401;
        throw err;
    }

    const {
        image_url = "",
        start_datetime,
        end_datetime,
        location,
        content,
        title,
        min_number,
        max_number,
        deadline,
        introduction,
        price
    } = req.body;

    if(
        !start_datetime ||
        !end_datetime ||
        !location ||
        !content ||
        !title ||
        !min_number ||
        !max_number ||
        !deadline ||
        !introduction ||
        !price
    ) {
        const err = new Error('Workshops Information are required');
        err.status = 400;
        throw err;
    }

    workshopsModel
        .propose(
            fb_id,
            image_url,
            new Date(start_datetime).getTime(),
            new Date(end_datetime).getTime(),
            location,
            content,
            title,
            min_number,
            max_number,
            new Date(deadline).getTime(),
            introduction,
            price,
            'judging'
        ).then(id => res.json(id))
        .catch(next);
});

// attend
router.post('/workshops/:w_id', function(req, res, next) {
    const fb_id = req.get('userID');
    const {w_id} = req.params;
    if (fb_id === undefined) {
        const err = new Error('attending a workshop need to login');
        err.status = 401;
        throw err;
    }
    if (!w_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    workshopsModel
        .attend(w_id, fb_id)
        .then(attendState => { res.json(attendState); })
        .catch(next);
});

// delete
router.delete('/workshops/:w_id', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('You need to login. (propose)');
        err.status = 401;
        throw err;
    }
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('workshop ID required. (delete)');
        err.status = 400;
        throw err;
    }

    workshopsModel
        .delete(w_id, fb_id)
        .then(() => res.sendStatus(200))
        .catch(next);
});

// update
router.put('/workshops/:w_id', function(req, res, next) {
    // check fb_id
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('You need to login. (propose)');
        err.status = 401;
        throw err;
    }
    // check parameters
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('workshop ID required. (delete)');
        err.status = 400;
        throw err;
    }
    // check body
    const {
        image_url = "",
        start_datetime,
        end_datetime,
        location,
        content,
        title,
        min_number,
        max_number,
        deadline,
        introduction,
        price
    } = req.body;

    if(
        !start_datetime ||
        !end_datetime ||
        !location ||
        !content ||
        !title ||
        !min_number ||
        !max_number ||
        !deadline ||
        !introduction ||
        !price ) {
        const err = new Error('Workshops Information are required');
        err.status = 400;
        throw err;
    }
    workshopsModel
        .update(
            w_id,
            fb_id,
            image_url,
            // new Date(start_datetime).getTime(),
            // new Date(end_datetime).getTime(),
            start_datetime,
            end_datetime,
            location,
            content,
            title,
            min_number,
            max_number,
            // new Date(deadline).getTime(),
            deadline,
            introduction,
            price
        ).then(workshop => { res.json(workshop); })
        .catch(next);
});

module.exports = router;
