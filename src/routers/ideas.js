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
router.get('/ideas', function(req, res, next) {
	const {searchText, order} = req.query;
	// console.log(JSON.stringify(req.query));
	var fbID = req.get('userID');
	if (fbID === undefined) {
		fbID = null;
	}

	ideasModel.list(searchText, order, fbID).then((ideas=[]) => {
		for (let idea of ideas) {
			idea.liked = (idea.liked=="1");
		}
		res.json(ideas);
	}).catch(next);
});

// like
router.post('/ideas/:i_id', function(req, res, next) {
	const {i_id} = req.params;
	const fb_id = req.get('userID');
	if (fb_id === undefined) {
        const err = new Error('like an idea need to login');
        err.status = 401;
        throw err;
	}
	if (!i_id) {
        const err = new Error('which idea you like');
        err.status = 400;
        throw err;
	}

	ideasModel.like(i_id, fb_id).then(ret => {
		// {i_id, like_number, liked: boolean}
		res.json(ret);
	}).catch(next);
});

module.exports = router;