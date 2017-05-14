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
        RETURNING id as p_id;
    `;

    const updateProfile = `
        UPDATE profiles
        SET
            name = $<name>,
            email = $<email>,
            picture_url = $<picture_url>,
            last_login_datetime = (extract(epoch from now()))
        WHERE profiles.fb_userid = $<fb_userid>
        RETURNING id as p_id;
    `;

    var available_time = '[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]';
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

    const profilesSQL = `
        SELECT profiles.id, profiles.available_time
        FROM profiles
        WHERE profiles.fb_userid = $1;
    `;

    const proposeSQL = `
        SELECT
            w.id as w_id,
            w.title,
            w.start_datetime,
            w.min_number,
            w.max_number,
            w.deadline,
            w.phase as state,
            count(attends.workshop_id) as attendees_number
        FROM workshops as w
        INNER JOIN proposes
        on proposes.profile_id = $1
        AND proposes.workshop_id = w.id
        LEFT JOIN attends
        on attends.workshop_id = w.id
        GROUP BY
        attends.workshop_id,
        w.id,
        w.title,
        w.start_datetime,
        w.min_number,
        w.max_number,
        w.deadline,
        w.phase;
    `;

    const attendSQL = `
        SELECT
          w.title,
          w.start_datetime,
          w.phase as state
        FROM workshops as w
        INNER JOIN attends
        on attends.profile_id = $1
        AND attends.workshop_id = w.id;
    `;


    const comeUPWithSQL = `
        SELECT
            i.id as i_id,
            i.idea_type,
            i.skill,
            count(likes.idea_id) as like_number
        FROM ideas as i
        INNER JOIN come_up_withs as c
        on c.profile_id = $1 AND c.idea_id = i.id
        LEFT JOIN likes
        on likes.idea_id = i.id
        GROUP BY
            i.id,
            i.idea_type,
            i.skill;
    `;

    const likesSQL = `
        SELECT
            i.id as i_id,
            i.idea_type,
            i.skill,
            count(i.id = l1.idea_id) as like_number
        FROM ideas as i
        INNER JOIN likes l1
        on l1.idea_id = i.id
        INNER JOIN likes l2
        on l2.profile_id = $1
        AND l2.idea_id = i.id
        GROUP BY
            i.id,
            i.idea_type,
            i.skill;
    `;

    return db.one(profilesSQL,fb_id)
    .then(profiles => {

        var propose = db.any(proposeSQL, profiles.id);
        var attend = db.any(attendSQL, profiles.id);
        var comeUPWith = db.any(comeUPWithSQL, profiles.id);
        var like = db.any(likesSQL, profiles.id);

        return Promise.all([JSON.parse(profiles.available_time), propose, attend, comeUPWith, like])
        .then(([available_time,[propose],[attend],[comeUPWith],[like]]) => {
            return new Promise((resolve, reject) => {
                resolve({available_time, propose, attend, comeUPWith, like});
            })
        })
    })
}

function updateAvailableTime(fb_id, available_time) {
    
}


module.exports = {
    regOrLogin,
    show
};
