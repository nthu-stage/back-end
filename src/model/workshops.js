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
        where.push(`w.phase = $2`);
    }
    const sql = `
SELECT
    w.id,
    w.image_url,
    w.title,
    w.start_datetime,
    w.min_number,
    w.max_number,
    w.introduction,
    w.phase,
    w.deadline,
    COUNT(a.profile_id) AS attendees_number
FROM workshops AS w
LEFT JOIN attends AS a
ON w.id = a.workshop_id
${where.length ? 'WHERE ' + where.join(' AND ') : ''}
GROUP BY w.id
ORDER BY w.deadline ASC
    `;
    return db.any(sql, [searchText, stateFilter]);
}

function propose(
    fb_id,
    image_url,
    start_datetime,
    end_datetime,
    location,
    content,
    title,
    min_number,
    max_number,
    deadline,
    introduction,
    price,
    phase
){
    const workshopsSQL = `
        INSERT INTO workshops ($<this:name>)
        VALUES (
            $<image_url>,
            $<start_datetime>,
            $<end_datetime>,
            $<location>,
            $<content>,
            $<title>,
            $<min_number>,
            $<max_number>,
            $<deadline>,
            $<introduction>,
            $<price>,
            $<phase>
        )
        RETURNING workshops.id as w_id;
    `;

    const proposeSQL = `
        INSERT INTO proposes
        SELECT profiles.id, workshops.id
        FROM profiles, workshops
        WHERE profiles.fb_userid = $1 AND workshops.id = $2;
    `;

    return db.one(workshopsSQL, {
        image_url,
        start_datetime,
        end_datetime,
        location,
        content,
        title,
        min_number,
        max_number,
        deadline,
        introduction,
        price,
        phase
    }).then(workshops => {
        db.none(proposeSQL, [fb_id, workshops.id]);
        return workshops;
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
    });
}



// Show
function show(w_id, fb_id) {

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE $1 = profiles.fb_userid;
    `;

    const attend_countSQL = `
        SELECT count(a.profile_id)
        FROM attends as a
        WHERE a.workshop_id = $1 AND a.profile_id = $2;
    `;

    const workshopsSQL = `
        SELECT
            w.image_url,
            w.start_datetime,
            w.end_datetime,
            w.location,
            w.content,
            w.title,
            w.max_number,
            w.deadline,
            w.pre_deadline,
            w.introduction,
            w.price,
            w.phase,
            profiles.name as name,
            bool_and($2 != 0) as attended
        FROM workshops as w
        INNER JOIN proposes
        on w.id = $1 AND proposes.workshop_id = $1
        INNER JOIN profiles
        on profiles.id = proposes.profile_id
        GROUP BY
            w.image_url,
            w.start_datetime,
            w.end_datetime,
            w.location,
            w.content,
            w.title,
            w.max_number,
            w.deadline,
            w.pre_deadline,
            w.introduction,
            w.price,
            w.phase,
            profiles.name;
    `;

    const ori_workshopsSQL = `
        SELECT *, $2
        FROM workshops
        WHERE workshops.id = $1;
    `;

    if(fb_id !== null) {
        return db.one(profilesSQL, fb_id)
        .then(profiles => {
            return db.one(attend_countSQL, [w_id, profiles.id])
            .then(attendCount => {
                return db.one(workshopsSQL, [w_id, attendCount.count]);
            }).catch(error => {
                console.log('ERROR:', error); // print the error;
            });
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
        INSERT INTO attends
        VALUES ($2, $1)
        RETURNING *;
    `;

    const phaseSQL = `
        SELECT bool_or(attends.profile_id = $2) as attended
        FROM attends
        WHERE attends.workshop_id = $1;
    `;

    return db.one(profilesSQL, fb_id)
    .then(profiles => {
        return db.one(attendSQL, [w_id, profiles.id])
        .then(attend => {
            return db.one(phaseSQL, [w_id, profiles.id]);
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
        });
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
    });
}



// Unattend
function unattend(w_id, fb_id) {
    const unattendSQL = `
        DELETE FROM attends
        WHERE attends.profile_id = $2
        AND attends.workshop_id = $1;
    `;

    return db.one(profilesSQL, fb_id)
    .then(profiles => {
        return db.one(unattendSQL, [w_id, profiles.id])
        .then(unattend => {
            return true;
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
            return false;
        });
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
