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
    const {searchText, stateFilter} = req.query;

    workshopsModel.list(searchText, stateFilter).then(workshops => {
        for (let w of workshops) {
            fn.tsWrapper(w, 'deadline');
            fn.tsWrapper(w, 'pre_deadline');
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

    workshopsModel.show(w_id, fbID) .then(workshop => {
        fn.tsWrapper(workshop, 'start_datetime');
        fn.tsWrapper(workshop, 'end_datetime');
        fn.tsWrapper(workshop, 'deadline');
        fn.tsWrapper(workshop, 'pre_deadline');
        if (workshop.attended === null) workshop.attended = false;
        res.json(workshop);
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

    workshopsModel.propose(
        fbID,
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

    workshopsModel.attend(w_id, fbID).then(attendState => {
        if(attendState.attended === '0') attendState.attended = false;
        else  attendState.attended = true;
        res.json(attendState);
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
