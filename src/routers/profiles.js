const express = require('express');
const bodyParser = require('body-parser');
const profilesModel = require('../model/profiles.js');
const fn = require('../fn.js');

const router = express.Router();

router.use(bodyParser.json());

//  regOrLogin
router.post('/profile', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('Not a corret ID for Login or Register');
        err.status = 401;
        throw err;
    }

    const {name, email, picture_url = ""} = req.body;

    if(!name || !email) {
        const err = new Error('Profiles Information are required');
        err.status = 400;
        throw err;
    }

    profilesModel
        .regOrLogin(name, email, fb_id, picture_url).then(id => {
        res.json(id);
    }).catch(next);
});

// show
router.get('/profile', function(req, res, next) {
    const fb_id = req.get('userID');
    if (fb_id === undefined) {
        const err = new Error('Not a corret ID for watching profiles');
        err.status = 401;
        throw err;
    }
    profilesModel.show(fb_id).then(profiles => {
        for (let p of profiles.propose) {
            fn.tsWrapper(p, "start_datetime");
            fn.tsWrapper(p, "deadline");
        }
        for (let a of profiles.attend) {
            fn.tsWrapper(a, "start_datetime");
        }
        res.json(profiles);
    }).catch(next);
})

// update
router.put('/profile', (req, res, next) => {
    const fb_id = req.get('userID');
    const {key} = req.query;
    if (fb_id === undefined) {
        const err = new Error('Not a corret ID for updating the profile.');
        err.status = 401;
        throw err;
    }
    switch (key) {
        case 'email':
            const {email} = req.body;
            if (!email) {
                const err = new Error('need email in request body');
                err.status = 401;
                throw err;
            }
            profilesModel
                .updateEmail(fb_id, email)
                .then(() => { res.json({email}); })
                .catch(next);
            break;
        case 'availableTime':
            const availableTime = req.body;
            if (!availableTime) {
                const err = new Error('need available time in request body');
                err.status = 401;
                throw err;
            }
            profilesModel
                .updateAvailableTime(fb_id, availableTime)
                .then(new_ => { res.json(JSON.parse(new_.available_time)); })
                .catch(next);
            break;
        default:
            const err = new Error('Unknown key to update');
            err.status = 400;
            throw err;
    }
})

module.exports = router;
