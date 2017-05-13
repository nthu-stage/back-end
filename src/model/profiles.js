if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

function regOrLogin(name, email, fb_userid, picture_url) {

    const checkSQL = `
        SELECT count(profiles.id)
        FROM profiles
        WHERE profiles.fb_userid = $1;
    `;

    const createProfilesSQL = `
        INSERT INTO profiles ($<this:name>)
        VALUES (
            $<name>,
            $<email>,
            $<fb_userid>,
            $<picture_url>,
            $<authority>,
            $<available_time>
        )
        RETURNING id;
    `;

    const updateProfile = `
        UPDATE profiles
        SET
            name = $<name>,
            email = $<email>,
            picture_url = $<picture_url>,
            last_login_datetime = (extract(epoch from now()))
        WHERE profiles.fb_userid = $<fb_userid>
        RETURNING id;
    `;

    var available_time = 'false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false';
    var authority = 'user';
    return db.one(checkSQL, fb_userid)
    .then(state => {
        if(state.count <= 0) {
            return db.one(createProfilesSQL, {name, email, fb_userid, picture_url, authority, available_time});
        }
        else {
            return db.one(updateProfile, {name, email, fb_userid, picture_url})
        }
    })
}


function show(fb_id) {

    const profilesIDSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE prfiles.fb_userid = $1;
    `;

    const profilesSQL = `
        SELECT
          profiles.available_time,
          propose
    `;


    return db.one(profilesIDSQL,fb_id)
    .then(profilesID=> {
        db.one(profilesSQL, profilesID.id)
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
        return false;
    });
}




module.exports = {
    regOrLogin,
    show
};
