var FB = require('fb');

FB.options({'appSecret': `${process.env.FB_APP_STAGE_SECRET}`});

function check(fb_userid, signedRequestValue) {
  var signedRequest  = FB.parseSignedRequest(signedRequestValue);
  return fb_userid == signedRequest.user_id;
}

module.exports = check;
