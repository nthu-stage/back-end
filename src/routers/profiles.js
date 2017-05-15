const express = require('express');
const bodyParser = require('body-parser');
const accessController = require('../middleware/access-controller.js');

const profilesModel = require('../model/profiles.js');

const router = express.Router();

router.use(bodyParser.json());
router.use(accessController);

//  regOrLogin
router.post('/profiles', function(req, res, next) {
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


router.get('/profiles', function(req, res, next) {
    const fbID = req.get('userID');
    if (fbID === undefined) {
        const err = new Error('Not a corret ID for watching profiles');
        err.status = 401;
        throw err;
    }
    profilesModel.show(fbID).then(profiles => {
        res.json(profiles);
    }).catch(next);
})






module.exports = router;
