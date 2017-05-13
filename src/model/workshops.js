if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

function list(searchText, stateFilter ) {
    var where = [];
    if (searchText) {
        // [TODO]:  temporarialy only search title.
        where.push(`w.title ILIKE '%$1:value%'`);
    }
    if (stateFilter) {
        where.push(`w.state = $2`);
    }
    // [TODO]: order by .
    const sql = `
        SELECT
            w.id,
            w.image_url,
            w.title,
            w.start_datetime,
            w.min_number,
            w.max_number,
            w.introduction,
            w.state,
            w.deadline,
            COUNT(a.profile_id)
        FROM workshops AS w
        LEFT JOIN attend AS a
        ON w.id = a.workshop_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        GROUP BY w.id
        ORDER BY w.deadline DESC
    `;
    return db.any(sql, [searchText, stateFilter]);
}

function propose(
    fb_id,
    image_url,
    title,
    start_datetime,
    end_datetime,
    min_number,
    max_number,
    deadline,
    location,
    introduction,
    content,
    state,
    price
){
    const workshopsSQL = `
        INSERT INTO workshops ($<this:name>)
        VALUES (
            $<image_url>,
            $<title>,
            $<start_datetime>,
            $<end_datetime>,
            $<min_number>,
            $<max_number>,
            $<deadline>,
            $<location>,
            $<introduction>,
            $<content>,
            $<state>,
            $<price>
        )
        RETURNING workshops.id;
    `;

    // extract(epoch from now())

    const proposeSQL = `
        INSERT INTO propose
        SELECT profiles.id, workshops.id
        FROM profiles, workshops
        WHERE profiles.fb_userid = $1 AND workshops.id = $2;
    `;

    return db.one(workshopsSQL, {
        image_url,
        title,
        start_datetime,
        end_datetime,
        min_number,
        max_number,
        deadline,
        location,
        introduction,
        content,
        state,
        price,
    }).then(workshops => {
        db.none(proposeSQL, [fb_id, workshops.id]);
        return workshops.id;
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
    });
}



// Show
function show(w_id, fb_id = null) {

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE $1 = profiles.fb_userid;
    `;

    const attend_countSQL = `
        SELECT count(a.profile_id)
        FROM attend as a
        WHERE a.workshop_id = $1 AND a.profile_id = $2;
    `;

    const workshopsSQL = `
        SELECT
            w.id,
            w.image_url,
            w.title,
            w.start_datetime,
            w.end_datetime,
            w.min_number,
            w.max_number,
            w.deadline,
            w.location,
            w.introduction,
            w.content,
            w.state,
            w.price,
            w.created_at,
            w.updated_at,
            bool_and($2 = 0)
        FROM workshops as w
        WHERE w.id = $1
    `;

    const ori_workshopsSQL = `
        SELECT *, $2
        FROM workshops
        WHERE workshops.id = $1;
    `;

    if(fb_userid !== NULL) {
        return db.one(profilesSQL, fb_id)
        .then(profiles => {
            let count = db.one(attend_countSQL, [w_id, profiles.id]);
            return db.one(workshopsSQL, [w_id, count]);
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
        });
    }
    else {
        return db.one(ori_workshopsSQL, [w_id, false]);
    }
}



// Attend
function attend(w_id, fb_id) {

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE $1 = profiles.fb_userid;
    `;

    const attendSQL = `
        INSERT INTO attend
        VALUES ($2, $1)
        RETURNING *;
    `;

    let profiles = db.one(profilesSQL, fb_id)

    return db.one(attendSQL, [w_id, profiles.id])
    .then(attend => {
        return true;
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
        return false;
    });
}



// Unattend
function unattend(w_id, fb_id) {
    const unattendSQL = `
        DELETE FROM attend
        WHERE attend.profile_id = $2
        AND attend.workshop_id = $1;
    `;

    let profiles = db.one(profilesSQL, fb_id)

    return db.one(unattendSQL, [w_id, profiles.id])
    .then(unattend => {
        return true;
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
        return false;
    });
}



module.exports = {
    propose,
    show,
    attend,
    unattend,
    list
};
