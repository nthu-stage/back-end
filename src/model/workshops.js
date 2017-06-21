if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

const pgp = require('pg-promise')({
    capSQL: true
});
const {
    get_p_id,
} = require('../fn.js');

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

function list(searchText, stateFilter, offset=0, limit=8) {
    const now = Date.now();

    var where = [];
    if (searchText) {
        // [TODO]:  temporarialy only search title.
        where.push(`w.title ILIKE '%$(searchText:value)%'`);
    }
    if (offset) {
        where.push(`rownum > $(offset)`);
    }

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
        w.state
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
      w.rownum
    ORDER BY rownum ASC
    LIMIT $(limit)
    `;

    function state_filter_predicate(workshop) {
        switch (stateFilter) {
            case "0":   return false;
            case "1":   return workshop.state=='reached';
            case "2":   return workshop.state=='judge_ac';
            case "all": return true; // TODO: remove this when production
            default:    return (workshop.state=='reached') || (workshop.state=='judge_ac');
        }
    }

    return db.task(t => {
        return t.none(update_unreached_sql, {now}).then(() => {
            return t.any(get_workshop_list_sql, {
                searchText,
                stateFilter,
                offset,
                limit
            });
        }).then(workshops => {
            for (let w of workshops) {
                attach_phase_on_workshop(w, now);
            }
            return workshops
                .filter(state_filter_predicate)
                .map(adapter);
        });
    });
}

function propose (fb_id, newWorkshopObj) {
    // [TODO]: handle pre_deadline settings: temporarialy the same as deadline

    var profile_id;

    return db.tx(t => {
        return get_p_id.call(t, fb_id).then(x => {
            profile_id = x;
        }).then(() => {
            // insert new workshop

            // manually setting field
            newWorkshopObj.state = 'judging';
            newWorkshopObj.pre_deadline = newWorkshopObj.deadline;

            let sql = pgp.helpers.insert(newWorkshopObj, null, 'workshops');
            sql += ' RETURNING workshops.id AS w_id;';
            return t.one(sql);
        }).then(({w_id: workshop_id}) => {
            // insert new propose
            let newProposeObj = {workshop_id, profile_id};
            let sql = pgp.helpers.insert(newProposeObj, null, 'proposes');
            sql += ' RETURNING workshop_id AS w_id;';
            return t.one(sql);
        });
    });
}

function show(w_id, fb_id) {
    var p_id;
    const now=Date.now();

    // one(w_id) -> {workshop_id, name}
    const get_proposer_sql = `
    SELECT workshop_id, name, picture_url
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
        proposer.name,
        proposer.picture_url,
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
        proposer.name,
        proposer.picture_url;
    `;

    return db.task(t => {
        return get_p_id.call(t, fb_id).then(x => {
            p_id = x;
        }).then(() => {
            return t.none(update_unreached_sql, {now});
        }).then(() => {
            return t.one(get_workshop_sql, {w_id, p_id});
        }).then(workshop => {
            attach_phase_on_workshop(workshop, now);
            delete workshop.state;
            return adapter(workshop);
        });
    });

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

    const get_attendees_number_sql = `
        SELECT
            COUNT(*) AS attendees_number
        FROM workshops
        LEFT JOIN attends
        on attends.workshop_id = workshops.id
        WHERE workshops.id = $(w_id)
        GROUP BY workshops.id;
    `;

    return db.tx(t => {
        return get_p_id.call(t, fb_id, {required: true}).then(x => {
            p_id = x;
        }).then(() => {
            return t.none(update_unreached_sql, {now});
        }).then(() => {
            return t.one(get_workshop_sql, {w_id, p_id}).then(workshop => {
                attach_phase_on_workshop(workshop, now);
                prop_list = ["attendees_number", "start_datetime", "end_datetime",
                    "deadline", "pre_deadline"];
                for (let prop of prop_list) {
                    workshop[prop] = (+ workshop[prop]);
                }
                delete workshop.state;
                return workshop;
            });
        }).then(workshop => {
            if (workshop.phase == 'investigating' || workshop.phase == 'reached') {
                return t.none(toggle_attendSQL, {w_id, p_id});
            } else if (workshop.phase == 'full' && workshop.attended) {
                return t.none(cancel_attend_sql, {w_id, p_id});
            }
            return null;
        }).then(() => {
            return t.one(get_attendees_number_sql, {w_id});
        }).then(({attendees_number}) => {
            return t.none(update_reached_sql, {attendees_number});
        }).then(() => {
            return t.one(get_attended_sql, {w_id, p_id});
        });
    });

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
