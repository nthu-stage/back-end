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
    price,
    created_at,
    updated_at
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
            $<price>,
            extract(epoch from now()),
            extract(epoch from now())
        )
        RETURNING id;
    `;

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
        created_at,
        updated_at
    }).then(workshops => {
        db.none(proposeSQL, [fb_id, workshops.id]);
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
    });
}


function show(workshops_id, fb_userid = null) {

    const porfilesSOL = `
        SELECT profiles.id
        FROM profiles
        WHERE $1 = profiles.fb_userid;
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
            w.bool_and($2 = a.profile_id)
        FROM workshops as w
        INNER JOIN attend as a
        on attend.workshop_id = workshops_id;
    `;

    if(fb_userid !== NULL) {
        db.one(profilesSQL, fb_userid)
        .then(profiles => {
            db.one(workshopsSQL, [workshops_id, profiles.id]);
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
        });
    }
}


// const workshopsSQL = `
//     SELECT
//         w.id,
//         w.image_url,
//         w.title,
//         w.start_datetime,
//         w.end_datetime,
//         w.min_number,
//         w.max_number,
//         w.deadline,
//         w.location,
//         w.introduction,
//         w.content,
//         w.state,
//         w.price,
//         w.created_at,
//         w.updated_at,
//         w.bool_and($2 = a.profile_id)
//     FROM workshops as w, attend as a
//     WHERE w.id = a.workshop_id;
// `;


module.exports = {
    list,
    propose
};
