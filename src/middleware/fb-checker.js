var FB = require('fb');

FB.options({'appSecret': `${process.env.FB_APP_STAGE_SECRET}`});

module.exports = function(req, res, next) {
    const fb_id = req.get('userID');
    // console.log(`response header: fb-id: ${fb_id}`);
    const signedRequestValue = req.get('signedRequest');
    if (fb_id) {
        var parsedSignedRequst = FB.parseSignedRequest(signedRequestValue);
        if ((parsedSignedRequst === undefined) || fb_id != parsedSignedRequst.user_id) {
            const err = new Error('Invalid fb user.');
            err.status = 401;
            throw err;
        }
        // console.log(`valid fb user with id: ${fb_id}`);
    }
    next();
};
