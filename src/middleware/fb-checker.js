var FB = require('fb');

FB.options({'appSecret': `${process.env.FB_APP_STAGE_SECRET}`});

module.exports = function(req, res, next) {
    const fb_id = req.get('userID');
    const access_token = req.get('accessToken');
    if (fb_id) {
        if (access_token === undefined) {
            let err = new Error('Invalid fb user. (fb-checker)');
            err.status = 401;
            throw err;
        }
        FB.api('/me', {access_token})
            .then(fb_res => fb_res.id)
            .then(id => {
                if (id !== fb_id) {
                    let err = new Error('Invalid fb user.');
                    err.status = 401;
                    throw err;
                }
            }).catch(next);
    }
    next();
};
