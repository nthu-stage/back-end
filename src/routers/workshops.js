const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const workshopsModel = require('../model/workshops.js');

const router = express.Router();


router.use(bodyParser.json());
router.use(accessController); // Allows cross-origin HTTP requests

// list
router.get('/workshops', function(req, res, next) {
    const {searchText, stateFilter} = req.query;

    workshopsModel.list(searchText, stateFilter).then(workshops => {
        for (let w of workshops) {
            // change property's name
            w.attendees_number = w.count;
            delete w.count;
        }
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

    res.json({
        "method": "GET",
        "action": "show()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fbID,
        w_id,
    })

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
        fbID,
    })

    // [TODO]: work with model.propose().
    res.json(`propose: POST body: ${req.body}`);
    // postModel.create(mood, text).then(post => {
    //     res.json(post);
    // }).catch(next);
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

    res.json({
        "method": "POST",
        "action": "attend()",
        "params": req.params,
        "query": req.query,
        "body": req.body,
        fbID,
        w_id,
    })

    // [TODO]: work with workshopsModel.attend().
    // voteModel.create(id, mood).then(post => {
    //     res.json(post);
    // }).catch(next);
});

module.exports = router;
