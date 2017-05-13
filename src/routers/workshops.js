const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');


const profilesModel = require('../model/profiles.js');
const ideasModel = require('../model/ideas.js');
const workshopsModel = require('../model/workshops.js');

const router = express.Router();


router.use(bodyParser.json());
router.use(accessController); // Allows cross-origin HTTP requests

// list
router.get('/workshops', function(req, res, next) {
    const {searchText, stateFilter} = req.query;

    workshopsModel.list(searchText, stateFilter).then(workshops => {
        res.json(workshops);
    }).catch(next);
});

// show
router.get('/workshops/:w_id', function(req, res, next) {
    var fbID = req.get('userID');
    if (fbID === undefined) {
        fbID = null;
    }
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    workshopsModel.show(w_id, fb_id) .then(workshops => {
        res.json(workshops);
    }).catch(next);
    // res.json({
    //     "method": "GET",
    //     "action": "show()",
    //     "params": req.params,
    //     "query": req.query,
    //     "body": req.body,
    //     fb_id,
    //     w_id,
    // })

    // res.json({
    //     "method": "GET",
    //     "action": "show()",
    //     "params": req.params,
    //     "query": req.query,
    //     "body": req.body,
    //     fbID,
    //     w_id,
    // })

    // [TODO]: work with workshopsModel.show().
    // workshopsModel.show(w_id).then(workshop => {
    //   res.json(workshop);
    // }).catch(next);
})


// propose
router.post('/workshops', function(req, res, next) {
    const fbID = req.get('userID');
    if (fbID === undefined) {
        const err = new Error('proposing a workshop need to login');
        err.status = 401;
        throw err;
    }

    const {
        image_url,
        title,
        start_datetime,
        end_datetime,
        min_number,
        max_number,
        deadline,
        location,
        introduction,
        content,
        state,
        price,
    } = req.body;

    if(
        !image_url ||
        !title ||
        !start_datetime ||
        !end_datetime ||
        !min_number ||
        !max_number ||
        !deadline ||
        !location ||
        !introduction ||
        !content ||
        !state ||
        !price
    ) {
        const err = new Error('Workshops Information are required');
            err.status = 400;
        throw err;
    }

    workshopsModel.propose(
        fbID,
        image_url,
        title,
        start_datetime,
        end_datetime,
        min_number,
        max_number,
        deadline,
        location,
        introduction,
        content,
        state,
        price
    ).then(id => {
        res.json(id);
    }).catch(next);
});

// attend
router.post('/workshops/:w_id', function(req, res, next) {
    const fbID = req.get('userID');
    const {w_id} = req.params;
    if (fbID === undefined) {
        const err = new Error('attending a workshop need to login');
        err.status = 401;
        throw err;
    }
    if (!w_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    workshopsModel.attend(w_id, fb_id).then(attend => {
        res.json(attend);
    }).catch(next);

    // res.json({
    //     "method": "POST",
    //     "action": "attend()",
    //     "params": req.params,
    //     "query": req.query,
    //     "body": req.body,
    //     fb_id,
    //     w_id,
    // })


    // [TODO]: work with workshopsModel.attend().
    // voteModel.create(id, mood).then(post => {
    //     res.json(post);
    // }).catch(next);
});

module.exports = router;
