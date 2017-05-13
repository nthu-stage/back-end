const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const worshopsModel = require('../model/workshops.js');
const profilesModel = require('../model/profiles.js');
const ideasModel = require('../model/ideas.js');

const router = express.Router();


router.use(bodyParser.json());
router.use(accessController); // Allows cross-origin HTTP requests

// list
router.get('/workshops', function(req, res, next) {
    var fb_id = req.get('fb-id');
    if (fb_id === undefined) {
        fb_id = null;
    }
    const {searchText, stateFilter} = req.query;

    // [TODO]: work with model.list().
    res.json({
        "method": "GET",
        "action": "list()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fb_id,
        searchText,
        stateFilter
    })
    // model.list(searchText, stateFilter).then(posts => {
    //     res.json(posts);
    // }).catch(next);
});

// show
router.get('/workshops/:w_id', function(req, res, next) {
    var fb_id = req.get('fb-id');
    if (fb_id === undefined) {
        fb_id = null;
    }
    const {w_id} = req.params;
    if (!w_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    worshopsModel.show(w_id, fb_id) .then(workshops => {
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

    // [TODO]: work with model.show().
    // model.show(w_id).then(workshop => {
    //   res.json(workshop);
    // }).catch(next);
})


// propose
router.post('/workshops', function(req, res, next) {
    const fb_id = req.get('fb-id');
    if (fb_id === undefined) {
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

    worshopsModel.propose(
        fb_id,
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
        price,
        state
    ).then(id => {
        res.json(id);
    }).catch(next);

    //[TODO]: get request body.
    // const {mood, text} = req.body;
    // if (!mood || !text) {
    //     const err = new Error('Mood and text are required');
    //         err.status = 400;
    //     throw err;
    // }


    // res.json({
    //     "method": "POST",
    //     "action": "propose()",
    //     "params": req.params,
    //     "query": req.query,
    //     "body": req.body,
    //     fb_id,
    // })

    // [TODO]: work with model.propose().
    // res.json(`propose: POST body: ${req.body}`);
    // postModel.create(mood, text).then(post => {
    //     res.json(post);
    // }).catch(next);
});

// attend
router.post('/workshops/:w_id', function(req, res, next) {
    const fb_id = req.get('fb-id');
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

    worshopsModel.attend(w_id, fb_id).then(attend => {
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

    // [TODO]: work with model.attend().
    // voteModel.create(id, mood).then(post => {
    //     res.json(post);
    // }).catch(next);
});

module.exports = router;
