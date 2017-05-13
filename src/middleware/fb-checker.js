var FB = require('fb');

FB.options({'appSecret': `${process.env.FB_APP_STAGE_SECRET}`});

module.exports = function(req, res, next) {
    const fbID = req.get('userID');
    // console.log(`response header: fb-id: ${fbID}`);
    const signedRequestValue = req.get('signedRequest');
    if (fbID) {
        var parsedSignedRequst = FB.parseSignedRequest(signedRequestValue);
        if ((parsedSignedRequst === undefined) || fbID != parsedSignedRequst.user_id) {
            const err = new Error('Invalid fb user.');
            err.status = 401;
            throw err;
        }
        // console.log(`valid fb user with id: ${fbID}`);
    }
    next();
};
