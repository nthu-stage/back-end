const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const model = require('../model/workshops.js');

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
    res.json({
        "method": "GET",
        "action": "show()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fb_id,
        w_id,
    })

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
    //[TODO]: get request body.
    // const {mood, text} = req.body;
    // if (!mood || !text) {
    //     const err = new Error('Mood and text are required');
    //         err.status = 400;
    //     throw err;
    // }

    res.json({
        "method": "POST",
        "action": "propose()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fb_id,
    })

    // [TODO]: work with model.propose().
    res.json(`propose: POST body: ${req.body}`);
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

    res.json({
        "method": "POST",
        "action": "attend()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fb_id,
        w_id,
    })

    // [TODO]: work with model.attend().
    // voteModel.create(id, mood).then(post => {
    //     res.json(post);
    // }).catch(next);
});

module.exports = router;
