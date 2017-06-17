const express = require('express');
const bodyParser = require('body-parser');
const ideasModel = require('../model/ideas.js');

const router = express.Router();

router.use(bodyParser.json());

// ComeUpWith
router.post('/ideas', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('proposing a workshop need to login');
        err.status = 401;
        throw err;
    }

    const {idea_type, skill, goal, web_url = "", image_url= ""} = req.body;

    if(!idea_type || !skill || !goal) {
        const err = new Error('Workshops Information are required');
            err.status = 400;
        throw err;
    }

    ideasModel.comeUpWith(fb_id, idea_type, skill, goal, web_url, image_url)
    .then(id => {
        res.json(id);
    }).catch(next);
});


//show
router.get('/ideas/:i_id', function(req, res, next) {
    var fb_id = req.get('userID');
    if (fb_id === undefined) {
        fb_id = null;
    }
    const {i_id} = req.params;
    if (!i_id) {
        const err = new Error('Show workshop page, workshop ID is required.');
        err.status = 400;
        throw err;
    }

    ideasModel.show(i_id, fb_id).then(ideas => {
		    ideas.like_number = (+ ideas.like_number);
        if(ideas.liked === null) ideas.liked = false;
        res.json(ideas);
    }).catch(next);
});

// list
router.get('/ideas', function(req, res, next) {
	const {searchText, order, offset, limit} = req.query;
	var fb_id = req.get('userID');
	if (fb_id === undefined) {
		fb_id = null;
	}

	ideasModel.list(searchText, order, fb_id, offset, limit).then((ideas=[]) => {
		for (let idea of ideas) {
			idea.liked = (idea.liked=="1");
			idea.like_number = (+ idea.like_number);
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

	ideasModel.like(i_id, fb_id).then(ret_idea => {
		// {i_id, like_number, liked: boolean}
		ret_idea.like_number = (+ ret_idea.like_number);
		res.json(ret_idea);
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
