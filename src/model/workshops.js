if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}


const fb_2_pID_sql = `SELECT id FROM profiles WHERE fb_userid=$<fb_id>`;
const check_author_sql = `
    SELECT COUNT(*) AS is_author
    FROM proposes
    WHERE profile_id=$<p_id> AND workshop_id=$<w_id>
`;

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
                        case "all":
                            return true;
                        default:
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
    state
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
            $<state>
        )
        RETURNING workshops.id as w_id;
    `;

    const proposeSQL = `
        INSERT INTO proposes
        SELECT profiles.id, workshops.id
        FROM profiles, workshops
        WHERE profiles.fb_userid = $1 AND workshops.id = $2
        RETURNING workshop_id AS w_id;
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
        state
    }).then(workshops => {
        return db.one(proposeSQL, [fb_id, workshops.w_id]);
    }).catch(error => {
        console.log('ERROR:', error); // print the error;
    });
}



// Show
function show(w_id, fb_id) {
    const stateSQL = `
        SELECT workshops.state
        FROM workshops
        WHERE workshops.id = $1
    `;

    const infoSQL =  `
        SELECT
            w.pre_deadline,
            w.min_number,
            w.start_datetime,
            w.end_datetime,
            count(attends.profile_id) as attendees_number
        FROM workshops as w
        INNER JOIN attends
        on w.id = $1
        AND attends.workshop_id = $1
        GROUP BY
            w.pre_deadline,
            w.min_number,
            w.start_datetime,
            w.end_datetime;
    `;

    const state_updateSQL = `
        UPDATE workshops
        SET workshops.sate = $2
        WHERE workshops.id = $1;
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
            profiles.name as name,
            bool_or(attends.profile_id = $2) as attended
        FROM workshops as w
        INNER JOIN proposes
        on w.id = $1 AND proposes.workshop_id = $1
        INNER JOIN profiles
        on profiles.id = proposes.profile_id
        LEFT JOIN attends
        on attends.workshop_id = $1
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
            profiles.name;
    `;


    var phase = db.one(stateSQL, w_id).then (w => {
        if (w.state === 'judging') {
            return 'judging';
        } else if (w.state === 'judge_na') {
            return 'judge_na';
        } else if (w.state === 'judge_ac') {
            return db.one(infoSQL, w_id).then(info => {
                const time = Date.now()/1000;
                if ((+info.pre_deadline) < time) {
                    //next_state = 3;
                    db.none(state_updateSQL, [w_id, 'unreached']);
                    return 'unreached'; // 未達標
                }
                if ((+info.pre_deadline) >= time && (+info.attendees_number) < (+info.min_number)) {
                    //next_state = 2;
                    return 'investigating'; // 調查中
                }
                if ((+info.pre_deadline) >= time && (+info.attendees_number) >= (+info.min_number)) {
                    //next_state = 4;
                    db.none(state_updateSQL, [w_id, 'reached']);
                    return 'reached'; // 已達標
                }
            })
        } else if (w.state === 'unreached') {
            return 'unreached';
        } else if (w.state === 'reached') {
            if ((+w.start_datetime) >= w.time) {
                //next_state = 4;
                return 'reached'; // 已達標
            }
            if ((+w.end_datetime) < w.time) {
                //next_state = 4;
                return 'over'; // 已結束
            }
        }
    })

    var workshops = db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            return t.one(workshopsSQL, [w_id, p_id]);
        });
    });


    return Promise.all([workshops, phase]).then(([workshops, phase]) => {
        workshops.phase = phase;
        return new Promise((resolve, reject) => {
            resolve(workshops);
        })
    })
}


// Attend
function attend(w_id, fb_id) {
    const stateSQL = `
        SELECT workshops.state
        FROM workshops
        WHERE workshops.id = $1
    `;

    const infoSQL =  `
        SELECT w.pre_deadline
        FROM workshops as w
        WHERE w.id = $1;
    `;

    const state_updateSQL = `
        UPDATE workshops
        SET workshops.sate = $2
        WHERE workshops.id = $1;
    `;

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE profiles.fb_userid = $1;
    `;

    const toggle_attendSQL = `
    DO
    $do$
    BEGIN
    IF (SELECT COUNT(*) FROM attends WHERE profile_id=$1 AND workshop_id=$2) > 0 THEN
    DELETE FROM attends WHERE profile_id=$1 AND workshop_id=$2;
    ELSE
    INSERT INTO attends VALUES ($1, $2);
    END IF;
    END
    $do$;
    `;

    const attend_checkSQL = `
        SELECT count(attends.profile_id) as attended
        FROM attends
        WHERE attends.profile_id = $1 AND attends.workshop_id = $2;
    `;

    return db.one(stateSQL, w_id).then(w => {
        if (w.state === 'judge_ac') {
            return db.one(infoSQL, w_id).then(info => {
                if ((+info.pre_deadline) < Date.now()/1000) {
                    db.none(state_updateSQL, [w_id, 'unreached']);
                    return {attended: "0"};
                } else {
                    return db.one(profilesSQL, fb_id).then(profiles => {
                        return db.none(toggle_attendSQL, [profiles.id, w_id]).then(() => {
                            return db.one(attend_checkSQL, [profiles.id, w_id]);
                        })
                    });
                }
            });
        } else {
            return {attended: "0"};
        }
    });
}

// attendees (dashboard)
function attendees(w_id, fb_id) {
    const attendees_id_sql = `
    SELECT profile_id FROM attends WHERE workshop_id=$<w_id>
    `;

    const sql = `
    SELECT name, email
    FROM profiles
    INNER JOIN (
        ${attendees_id_sql}
    ) AS a
    ON id=a.profile_id
    `;

    return db.any(sql, {w_id});
    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {

        });
    });
    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            console.log(`p_id = ${p_id}`);
            if (p_id ===0 ) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return t.one(check_author_sql, {p_id, w_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match profile and idea: not author or workshop does not exist.');
                    err.status = 400;
                    throw err;
                }
                return t.any(sql, [p_id, searchText]);
            });
        });
    });
}

module.exports = {
    propose,
    show,
    attend,
    list,
    attendees
};
