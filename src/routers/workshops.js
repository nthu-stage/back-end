const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const model = require('../model/workshops.js');

const router = express.Router();


router.use(bodyParser.json());
router.use(accessController); // Allows cross-origin HTTP requests

// List
router.get('/workshops', function(req, res, next) {
    const {searchText, stateFilter} = req.query;
    res.json("GET workshops list");
    // model.list(searchText, stateFilter).then(posts => {
    //     res.json(posts);
    // }).catch(next);
});

// Show
router.get('/workshops/:w_id', function(req, res, next) {
    const {w_id} = req.params;
    if (!w_id) {
      const err = new Error('Show workshop page, ID is required.');
      err.status = 400;
      throw err;
    }
    res.json("Show workshops page");

    // model.show(w_id).then(workshop => {
    //   res.json(workshop);
    // }).catch(next);
})


// // Create
// router.post('/workshops', function(req, res, next) {
//     const {mood, text} = req.body;
//     if (!mood || !text) {
//         const err = new Error('Mood and text are required');
//         err.status = 400;
//         throw err;
//     }
//     postModel.create(mood, text).then(post => {
//         res.json(post);
//     }).catch(next);
// });

// // Vote
// router.post('/posts/:id', function(req, res, next) {
//     const {id} = req.params;
//     if (!id || !mood) {
//         const err = new Error('Post ID and mood are required');
//         err.status = 400;
//         throw err;
//     }
//     voteModel.create(id, mood).then(post => {
//         res.json(post);
//     }).catch(next);
// });

module.exports = router;
