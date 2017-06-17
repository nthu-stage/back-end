if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

const fn = require('../fn.js');
const get_p_id = fn.get_p_id;

// none(now) -> void
const update_unreached_sql = `
UPDATE workshops
SET state = 'unreached'
WHERE state = 'judge_ac' AND pre_deadline < $(now)
`;

// none(w_id) -> void, only update workshop that attended
const update_reached_sql = `
UPDATE workshops
SET state='reached'
WHERE state='judge_ac' AND $(attendees_number) >= min_number
`;

// one(w_id) -> {attendees_number}
const get_attendees_number_sql = `
SELECT count(*) AS attendees_number
FROM attends
WHERE workshop_id = $(w_id);
`;

function check_workshop_author(w_id, p_id) {
    // one(p_id, w_id) -> {is_author}, if is_author == "0"
    const sql = `
    SELECT COUNT(*) AS is_author
    FROM proposes
    WHERE profile_id=$(p_id) AND workshop_id=$(w_id)
    `;

    return this
        .one(sql, {p_id, w_id})
        .then(({is_author}) => {
            if (is_author == "0") {
                const err = new Error('Cannot match user and workshop.');
                err.status = 400;
                throw err;
            }
            return true;
        });
}

function attach_phase_on_workshop(workshop, now) {
    // workshop should contain state, deadline, max_number,
    // and attendees_number (need to attach beforehand)
    // TODO: fully test the phase mapping
    switch (workshop.state) {
        case 'judge_ac':
            workshop.phase='investigating';
            break;
        case 'reached':
            if (workshop.deadline < now) {
                workshop.phase='closed';
            } else if (workshop.end_datetime < now) {
                workshop.phase='over';
            } else if (workshop.attendees_number == workshop.max_number) {
                workshop.phase='full';
            } else {
                workshop.phase='reached';
            }
            break;
        default:
            workshop.phase = workshop.state;
    }
}

function adapter(workshop) {
    // type cast timestamp field to int
    var prop_list = ["start_datetime", "end_datetime", "deadline", "pre_deadline",
        "created_at", "updated_at", "attendees_number"];
    for (let prop of prop_list) {
        if (workshop.hasOwnProperty(prop)) {
            workshop[prop] = (+ workshop[prop]);
        }
    }

    if (workshop.hasOwnProperty("attended") && workshop.attended === null) {
        workshop.attended = false;
    }
    return workshop;
}


/////////////////
//  API below  //
/////////////////

function list(searchText, stateFilter, start) {
    const now = Date.now();

    var where = [];
    if (searchText) {
        // [TODO]:  temporarialy only search title.
        where.push(`w.title ILIKE '%$(searchText:value)%'`);
    }
    if (start) {
        where.push(`rownum > $<start>`);
    }

    // any(searchText, stateFilter) -> [{attendees_number, ...workshop}]
    // const get_workshop_list_sql = `
    // SELECT w.id AS w_id,
    //     w.image_url,
    //     w.title,
    //     w.min_number,
    //     w.max_number,
    //     w.deadline,
    //     w.pre_deadline,
    //     w.introduction,
    //     w.price,
    //     COUNT(a.profile_id) AS attendees_number,
    //     w.start_datetime,
    //     w.end_datetime,
    //     w.state
    // FROM workshops AS w
    // LEFT JOIN attends AS a
    // ON w.id = a.workshop_id
    // ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    // GROUP BY w.id
    // ORDER BY w.deadline ASC
    // LIMIT 8
    // `;
    const get_workshop_list_sql = `
    SELECT
        w.id AS w_id,
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
        w.state,
        rownum
    FROM (
        SELECT ROW_NUMBER() OVER ( ORDER BY workshops.deadline ASC ) AS rownum, *
        FROM workshops
    ) AS w
    LEFT JOIN attends AS a
    ON w.id = a.workshop_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY
      w.id,
      w.image_url,
      w.title,
      w.min_number,
      w.max_number,
      w.deadline,
      w.pre_deadline,
      w.introduction,
      w.price,
      w.start_datetime,
      w.end_datetime,
      w.state,
      rownum
    ORDER BY w.deadline ASC
    LIMIT 8
    `;
    function state_filter_predicate(workshop) {
        switch (stateFilter) {
            case "0":   return false;
            case "1":   return w.state=='reached';
            case "2":   return w.state=='judge_ac';
            case "all": return true; // TODO: remove this when production
            default:    return (w.state=='reached') || (w.state=='judge_ac');
        }
    }

    function source(index, data, delay) {
        const now=Date.now();
        switch (index) {
            case 0: {
                return this.none(update_unreached_sql, {now});
            }
            case 1: {
                return this.any(get_workshop_list_sql, {searchText, stateFilter, start});
            }
            case 2: {
                let workshops = data;
                for (let w of workshops) {
                    attach_phase_on_workshop(w, now);
                }
                return workshops.filter(state_filter_predicate);
            }
        }
    }

    return db
        .tx(t => t.sequence(source, {track: true}))
        .then(data => data.slice(-1)[0])
        .then(ws => ws.map(adapter))
        .catch(err => { throw err.error; });
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

function show(w_id, fb_id) {
    var p_id;

    // one(w_id) -> {workshop_id, name}
    const get_proposer_sql = `
    SELECT workshop_id, name
    FROM profiles
    INNER JOIN proposes
    ON profiles.id=proposes.profile_id
    WHERE workshop_id=$(w_id)
    `;

    // one(w_id, p_id) ->
    // all field of workshop except
    //      id, created_at, updated_at, state(but need for gen phase)
    // and addition
    //      name(author name),
    //      attendees_number,
    //      attended,
    //      phase
    const get_workshop_sql = `
    SELECT
    image_url,
        title,
        location,
        introduction,
        content,
        min_number,
        max_number,
        price,
        state,
        start_datetime,
        end_datetime,
        deadline,
        pre_deadline,
        proposer.name AS name,
        COUNT(attends.profile_id) AS attendees_number,
        bool_or(attends.profile_id=$(p_id)) AS attended
    FROM workshops
    INNER JOIN (
        ${get_proposer_sql}
    ) AS proposer
    ON proposer.workshop_id=workshops.id
    LEFT JOIN attends
    on attends.workshop_id=workshops.id
    WHERE workshops.id=$(w_id)
    GROUP BY
    workshops.id,
        proposer.name;
    `;

    function source(index, data, delay) {
        const now=Date.now();
        switch (index) {
            case 0: {
                return this.none(update_unreached_sql, {now});
            }
            case 1: {
                return this.one(get_workshop_sql, {w_id, p_id});
            }
            case 2: {
                let workshop = data;
                attach_phase_on_workshop(workshop, now);
                delete workshop.state;
                return workshop;
            }
        }
    }

    return get_p_id.call(db, fb_id)
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source, {track: true})))
        .then(data => data.slice(-1)[0])
        .then(w => adapter(w))
        .catch(err => { throw err.error; });
}

function attend(w_id, fb_id) {
    var p_id;
    const now=Date.now();

    // none(w_id, p_id) -> void
    const cancel_attend_sql = `
    DELETE FROM attends WHERE profile_id=$(p_id) AND workshop_id=$(w_id);
    `;

    // none(w_id, p_id) -> void
    const toggle_attendSQL = `
    DO
    $do$
    BEGIN
    IF (SELECT COUNT(*) FROM attends WHERE profile_id=$(p_id) AND workshop_id=$(w_id)) > 0 THEN
    ${cancel_attend_sql}
    ELSE
    INSERT INTO attends VALUES ($(p_id), $(w_id));
    END IF;
    END
    $do$;
    `;

    // one(w_id, p_id) -> {attended: Boolean}
    const get_attended_sql = `
    SELECT bool_or(attends.profile_id=$(p_id)) AS attended
    FROM attends
    WHERE workshop_id = $(w_id)
    `;

    // one(w_id, p_id) -> see below
    const get_workshop_sql = `
    SELECT
        min_number,
        max_number,
        state,
        start_datetime,
        end_datetime,
        deadline,
        pre_deadline,
        COUNT(attends.profile_id) AS attendees_number,
        bool_or(attends.profile_id=$(p_id)) AS attended
    FROM workshops
    LEFT JOIN attends
    on attends.workshop_id=workshops.id
    WHERE workshops.id=$(w_id)
    GROUP BY workshops.id
    `;

    function source(index, data, delay) {
        switch (index) {
            case 0: {
                return this.none(update_unreached_sql, {now});
            }
            // case 1: {
            //     return get_p_id.call(this, fb_id, {required: true});
            // }
            case 1: {
                // let p_id = data;
                return this
                    .one(get_workshop_sql, {w_id, p_id})
                    .then(workshop => {
                        attach_phase_on_workshop(workshop, now);
                        prop_list = ["attendees_number", "start_datetime", "end_datetime",
                            "deadline", "pre_deadline"];
                        for (let prop of prop_list) {
                            workshop[prop] = (+ workshop[prop]);
                        }
                        delete workshop.state;
                        return workshop;
                    });
            }
            case 2: {
                let workshop = data;
                if (workshop.phase == 'investigating' || workshop.phase == 'reached') {
                    return this.none(toggle_attendSQL, {w_id, p_id}).then(() => null);
                } else if (workshop.phase == 'full' && workshop.attended) {
                    return this.none(cancel_attend_sql, {w_id, p_id}).then(() => null);
                }
                return null;
            }
            case 3: {
                return this.one(get_attended_sql, {w_id, p_id});
            }
        }
    }

    return get_p_id.call(db, fb_id, {required: true})
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source, {track: true})))
        .then(data => data.slice(-1)[0])
        .catch(err => { throw err.error; });
}

// attendees (dashboard)
function attendees(w_id, fb_id) {
    var p_id;

    // any(w_id)
    const sql = `
    SELECT name, email
    FROM profiles
    INNER JOIN attends
    ON id=attends.profile_id
    WHERE workshop_id=$(w_id)
    `;

    function source(index, data, delay) {
        const now=Date.now();
        switch (index) {
            case 0: {
                return check_workshop_author.call(this, w_id, p_id);
            }
            case 1: {
                return this.any(sql, {w_id});
            }
        }
    }

    return get_p_id.call(db, fb_id, {required: true})
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source, {track: true})))
        .then(data => data.slice(-1)[0])
        .catch(err => { throw err.error; });
}

function delete_(w_id, fb_id) {
    var p_id;
    const sql = `
    DELETE FROM workshops
    WHERE id=$(w_id)
    `;

    function source(index, data, delay) {
        switch (index) {
            case 0: {
                return check_workshop_author.call(this, w_id, p_id);
            }
            case 1: {
                return this.none(sql, {w_id});
            }
        }
    }

    return get_p_id.call(db, fb_id, {required: true})
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source)))
        .catch(err => { throw err.error; });
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
    var p_id;

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

    function source(index, data, delay) {
        switch (index) {
            case 0: {
                return check_workshop_author.call(this, w_id, p_id);
            }
            case 1: {
                return this.one(sql, {w_id, image_url, start_datetime, end_datetime, location,
                    content, title, min_number, max_number, deadline, introduction, price});
            }
        }
    }

    return get_p_id.call(db, fb_id, {required: true})
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source, {track: true})))
        .then(data => data.slice(-1)[0])
        .then(w => adapter(w))
        .catch(err => { throw err.error; });
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
