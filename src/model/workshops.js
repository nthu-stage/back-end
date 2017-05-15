if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

function list(searchText, stateFilter) {
    const cur_time = Date.now()/1000;

    var where = [];
    if (searchText) {
        // [TODO]:  temporarialy only search title.
        where.push(`w.title ILIKE '%$<searchText:value>%'`);
    }

    const update_unreached_sql = `
        UPDATE workshops
        SET state = 'unreached'
        WHERE
            state = 'judge_ac' AND
            pre_deadline < $<cur_time>
    `;
    const sql = `
        SELECT
            w.id as w_id,
            w.image_url,
            w.title,
            w.min_number,
            w.max_number,
            w.deadline,
            w.pre_deadline,
            w.introduction,
            w.price,
            COUNT(a.profile_id) AS attendees_number,
            w.start_datetime,
            w.end_datetime,
            w.state
        FROM workshops AS w
        LEFT JOIN attends AS a
        ON w.id = a.workshop_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        GROUP BY w.id
        ORDER BY w.deadline ASC
    `;
    return db.task(t => {
        return t.none(update_unreached_sql , {cur_time}).then(() => {
            return t.any(sql, {searchText, stateFilter}).then(ws => {
                for (let w of ws) {
                    switch (w.state) {
                        case 'judging':   w.phase='judging';       break;
                        case 'judge_na':  w.phase='judge_na';      break;
                        case 'judge_ac':  w.phase='investigating'; break;
                        case 'unreached': w.phase='unreached';     break;
                        default:/*reached*/
                            w.phase=(w.end_datetime<cur_time) ? 'over' : 'reached';
                    }
                    delete w.start_datetime;
                    delete w.end_datetime;
                    delete w.state
                }
                return ws.filter(w => {
                    switch (stateFilter) {
                        case "0":
                            return false;
                        case "1":
                            return w.phase=='reached';
                        case "2":
                            return w.phase=='investigating';
                        // debug only
                        // case "all":
                        //     return true;
                        default:
                            console.log("default case");
                            return (w.phase=='reached') || (w.phase=='investigating');
                    }
                });
            });
        });
    });
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
