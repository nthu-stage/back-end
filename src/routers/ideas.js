const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const ideasModel = require('../model/ideas.js');

const router = express.Router();

router.use(bodyParser.json());
router.use(accessController); // Allows cross-origin HTTP requests

// ComeUpWith
router.post('/ideas', function(req, res, next) {
    const fbID = req.get('userID');
    if (fbID === undefined) {
        const err = new Error('proposing a workshop need to login');
        err.status = 401;
        throw err;
    }

    const {ideas_type, skill, goal, web_url, image_url} = req.body;

    if(!ideas_type || !skill || !goal || !web_url || !image_url) {
        const err = new Error('Workshops Information are required');
            err.status = 400;
        throw err;
    }

    ideasModel.comeUpWith(fbID, ideas_type, skill, goal, web_url, image_url)
    .then(id => {
        res.json(id);
    }).catch(next);
});


//show
router.get('/ideas/:i_id', function(req, res, next) {
    var fbID = req.get('userID');
    if (fbID === undefined) {
        fbID = null;
    }
    const {i_id} = req.params;
    if (!i_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    ideasModel.show(i_id, fbID).then(ideas => {
        res.json(ideas);
    }).catch(next);
});

module.exports = router;
