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

    const {idea_type, skill, goal, web_url, image_url} = req.body;

    if(!idea_type || !skill || !goal || !web_url || !image_url) {
        const err = new Error('Workshops Information are required');
            err.status = 400;
        throw err;
    }

    ideasModel.comeUpWith(fbID, idea_type, skill, goal, web_url, image_url)
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

// update
router.put('/ideas/:i_id', function(req, res, next) {
	const {i_id} = req.params;
    const {
		skill, goal, web_url="", image_url=""
    } = req.body;
    const fb_id = req.get('userID');
	if (fb_id === undefined) {
        const err = new Error('update ideas need to login');
        err.status = 401;
        throw err;
	}
	if (!i_id) {
        const err = new Error('which idea you want to update');
        err.status = 400;
        throw err;
	}

	ideasModel.update(i_id, fb_id, skill, goal, web_url, image_url).then(() => {
		// only response status 200
		res.sendStatus(200);
	}).catch(next);
});

// delete
router.delete('/ideas/:i_id', (req, res, next) => {
	const {i_id} = req.params;
	const fb_id = req.get('userID');
	if (fb_id === undefined) {
		const err = new Error('delete ideas need to login');
		err.status = 401;
		throw err;
	}
	if (!i_id) {
		const err = new Error('which idea you want to delete');
		err.status = 400;
		throw err;
	}

	ideasModel.remove(i_id, fb_id).then(() => {
		res.sendStatus(200);
	}).catch(next);
})

module.exports = router;
