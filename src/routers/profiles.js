const express = require('express');
const bodyParser = require('body-parser');
const profilesModel = require('../model/profiles.js');
const fn = require('../fn.js');

const router = express.Router();

router.use(bodyParser.json());

//  regOrLogin
router.post('/profile', function(req, res, next) {
    const fbID = req.get('userID');
    if (fbID === undefined) {
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

    profilesModel.regOrLogin(name, email, fbID, picture_url).then(id => {
        res.json(id);
    }).catch(next);
});

// show
router.get('/profile', function(req, res, next) {
    const fbID = req.get('userID');
    if (fbID === undefined) {
        const err = new Error('Not a corret ID for watching profiles');
        err.status = 401;
        throw err;
    }
    profilesModel.show(fbID).then(profiles => {
        fn.prop_ts_2_datestring(profiles.propose, "start_datetime");
        fn.prop_ts_2_datestring(profiles.propose, "deadline");
        res.json(profiles);
    }).catch(next);
})

// update
router.put('/profile', (req, res, next) => {
    const fbID = req.get('userID');
    const {key} = req.query;
    if (fbID === undefined) {
        const err = new Error('Not a corret ID for updating the profile.');
        err.status = 401;
        throw err;
    }
    switch (key) {
        case 'availableTime':
            const availableTime = req.body;
            if (!availableTime) {
                const err = new Error('need available time in request body');
                err.status = 401;
                throw err;
            }
            profilesModel.updateAvailableTime(fbID, availableTime).then(new_avai_time => {
                res.json(JSON.parse(new_avai_time.available_time));
            }).catch(next);
            break;
        default:
            const err = new Error('Unknown key to update');
            err.status = 400;
            throw err;
    }
})




module.exports = router;
