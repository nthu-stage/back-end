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
            $<fb_id>,
            $<email>,
            $<>
        )
    `;

    return db.one(checkSQL, fb_id)
    .then(state => {
        if(state.count === 0){
            db.one(createProfilesSQL, {name, fb_id, email, fb_userid, picture_url});
        }
        else {

        }
    })
}
