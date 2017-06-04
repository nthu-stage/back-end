if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}


const get_p_id_from_fb_sql = `SELECT id FROM profiles WHERE fb_userid=$(fb_id)`;
const check_workshop_author_sql = `
    SELECT COUNT(*) AS is_author
    FROM proposes
    WHERE profile_id=$(p_id) AND workshop_id=$(w_id)
`;
const update_unreached_sql = `
    UPDATE workshops
    SET state = 'unreached'
    WHERE
        state = 'judge_ac' AND pre_deadline < $(cur_time)
`;


function list(searchText, stateFilter) {
    const cur_time = Date.now();

    var where = [];
    if (searchText) {
        // [TODO]:  temporarialy only search title.
        where.push(`w.title ILIKE '%$<searchText:value>%'`);
    }

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
            $(image_url),
            $(start_datetime),
            $(end_datetime),
            $(location),
            $(content),
            $(title),
            $(min_number),
            $(max_number),
            $(deadline),
            $(introduction),
            $(price),
            $(state)
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
        WHERE workshops.id = $(w_id)
    `;

    const infoSQL =  `
        SELECT
            w.pre_deadline,
            w.min_number
        FROM workshops as w
        WHERE w.id = $(w_id)
    `;

    const attendees_numberSQL = `
        SELECT count(*) AS attendees_number
        FROM attends
        WHERE workshop_id = $(w_id);
    `;

    const state_updateSQL = `
        UPDATE workshops
        SET state = $(state)
        WHERE workshops.id = $(w_id);
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
            w.min_number,
            w.deadline,
            w.pre_deadline,
            w.introduction,
            w.price,
            profiles.name as name,
            bool_or(attends.profile_id = $(p_id)) as attended
        FROM workshops as w
        INNER JOIN proposes
        on w.id = $(w_id) AND proposes.workshop_id = $(w_id)
        INNER JOIN profiles
        on profiles.id = proposes.profile_id
        LEFT JOIN attends
        on attends.workshop_id = $(w_id)
        GROUP BY
            w.image_url,
            w.start_datetime,
            w.end_datetime,
            w.location,
            w.content,
            w.title,
            w.max_number,
            w.min_number,
            w.deadline,
            w.pre_deadline,
            w.introduction,
            w.price,
            profiles.name;
    `;


    var phase = db.one(stateSQL, {w_id}).then(w => {
        if (w.state === 'judging') {
            return 'judging';
        } else if (w.state === 'judge_na') {
            return 'judge_na';
        } else if (w.state === 'judge_ac') {
            return db.one(infoSQL, {w_id}).then(info => {
                const time = Date.now();
                info.pre_deadline = (+ info.pre_deadline);
                info.min_number   = (+ info.pre_deadline);
                if (info.pre_deadline < time) {
                    //next_state = 3;
                    return db
                        .none(state_updateSQL, {w_id, state: 'unreached'})
                        .then(() => 'unreached');
                } else {
                    return db.one(attendees_numberSQL, {w_id}).then(({attendees_number}) => {
                        attendees_number = (+ attendees_number);
                        if (attendees_number < info.min_number) {
                            //next_state = 2;
                            return 'investigating'; // 調查中
                        } else  {
                            //next_state = 4;
                            return db
                                .none(state_updateSQL, {w_id, state: 'reached'})
                                .then(() => 'reached');
                        }
                    });
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

    var attendees_number = db
        .one(attendees_numberSQL, {w_id})
        .then(({attendees_number}) => (+ attendees_number));

    var workshops = db.task(t => {
        return t.any(get_p_id_from_fb_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            return t.one(workshopsSQL, {w_id, p_id});
        });
    });

    return Promise
        .all([workshops, phase, attendees_number])
        .then(([workshops, phase, attendees_number]) => {
            workshops.phase = phase;
            workshops.attendees_number = attendees_number;
            return new Promise((resolve, reject) => {
                resolve(workshops);
            });
        });
}


// Attend
function attend(w_id, fb_id) {
    const stateSQL = `
        SELECT workshops.state
        FROM workshops
        WHERE workshops.id = $(w_id)
    `;

    const infoSQL =  `
        SELECT w.pre_deadline
        FROM workshops as w
        WHERE w.id = $(w_id);
    `;

    const state_updateSQL = `
        UPDATE workshops
        SET state = $(state)
        WHERE workshops.id = $(w_id);
    `;

    const toggle_attendSQL = `
    DO
    $do$
    BEGIN
    IF (SELECT COUNT(*) FROM attends WHERE profile_id=$(p_id) AND workshop_id=$(w_id)) > 0 THEN
    DELETE FROM attends WHERE profile_id=$(p_id) AND workshop_id=$(w_id);
    ELSE
    INSERT INTO attends VALUES ($(p_id), $(w_id));
    END IF;
    END
    $do$;
    `;

    const attend_checkSQL = `
        SELECT count(attends.profile_id) as attended
        FROM attends
        WHERE attends.profile_id = $(p_id) AND attends.workshop_id = $(w_id);
    `;

    return db.one(stateSQL, {w_id}).then(w => {
        // TODO: judge state
        // TODO: cannot attend more than max_number
        if (w.state === 'judge_ac' || w.state === 'reached') {
            return db.one(infoSQL, {w_id}).then(info => {
                if ((+info.pre_deadline) < Date.now()) {
                    db.none(state_updateSQL, {w_id, state: 'unreached'}).catch(err=>{
                        throw err;
                    });
                    return {attended: "0"};
                } else {
                    return db.any(get_p_id_from_fb_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
                        if (p_id ===0 ) {
                            const err = new Error('Cannot found this fb user in database.');
                            err.status = 400;
                            throw err;
                        }
                        return db.none(toggle_attendSQL, {p_id, w_id}).then(() => {
                            return db.one(attend_checkSQL, {p_id, w_id});
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
    SELECT profile_id FROM attends WHERE workshop_id=$(w_id)
    `;

    const sql = `
    SELECT name, email
    FROM profiles
    INNER JOIN (
        ${attendees_id_sql}
    ) AS a
    ON id=a.profile_id
    `;

    return db.task(t => {
        return t.any(get_p_id_from_fb_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id ===0 ) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return t.one(check_workshop_author_sql, {p_id, w_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match user and workshop.');
                    err.status = 400;
                    throw err;
                }
                return t.any(sql, {w_id});
            });
        });
    });
}

function delete_(w_id, fb_id) {
    const sql = `
        DELETE FROM workshops
        WHERE id=$(w_id)
    `;
    return db.task(t => {
        return t.any(get_p_id_from_fb_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id ===0 ) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return t.one(check_workshop_author_sql, {p_id, w_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match user and workshop.');
                    err.status = 400;
                    throw err;
                }
                return t.none(sql, {w_id});
            });
        });
    });
}

function update(
    w_id,
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
    price
){
    const obj = {
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
        price
    };
    const sql = `
        UPDATE workshops
        SET
            image_url      = $(image_url),
            start_datetime = $(start_datetime),
            end_datetime   = $(end_datetime),
            location       = $(location),
            content        = $(content),
            title          = $(title),
            min_number     = $(min_number),
            max_number     = $(max_number),
            deadline       = $(deadline),
            introduction   = $(introduction),
            price          = $(price)
        WHERE id=$(w_id)
        RETURNING *;
    `;
    return db.task(t => {
        return t.any(get_p_id_from_fb_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id ===0 ) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return t.one(check_workshop_author_sql, {p_id, w_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match user and workshop.');
                    err.status = 400;
                    throw err;
                }
                return t.one(sql, {w_id, image_url, start_datetime, end_datetime, location,
                    content, title, min_number, max_number, deadline, introduction, price});
            });
        });
    });
}

module.exports = {
    propose,
    show,
    attend,
    list,
    attendees,
    delete: delete_,
    update,
};
