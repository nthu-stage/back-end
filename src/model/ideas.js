if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

function show (i_id, fb_id) {

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE profiles.fb_userid = $1;
    `;

    const like_stateSQL = `
        SELECT count(idea_id)
        FROM like
        WHERE like.idea_id = $1
        AND like.profile_id = $2;
    `;

    const profile_avalaibleSQL = `
        SELECT profiles.available_time
        FROM profiles;
    ` ;

    const like_countSQL = `
        SELECT count(like.profile_id)
        FROM like
        WHERE like.idea_id = $1;
    `;

    const comeupwithSQL = `
        SELECT count(c.profile_id)
        FROM come_up_with as c
        WHERE c.profile_id = $2 AND c.idea_id = $1;
    `;

    const ideasSQL = `
        SELECT
            i.id,
            i.idea_type,
            i.skill,
            i.goal,
            $2,
            i.web_url,
            i.image_url,
            $3,
            $4,
            $5
        FROM ideas
        WHERE ideas.id = $1;
    `;

    let likeState = db.one(profilesSQL, fb_id).then(profiles => {
        let state = db.one(like_stateSQL, [i_id, profiles.id])
        if(state.count > 0) {
            return true ;
        }
        else {
            return false;
        }
    })

    let likeCount = db.one(like_countSQL, i_id);

    let editorState = db.one(profilesSQL, fb_id).then(profiles => {
        let state = db.one(comeupwithSQL, [i_id, profiles.id])
        if(state.count > 0) {
            return true ;
        }
        else {
            return false;
        }
    })

    var available = [];

    for(let i=0 ; i<21 ; i++) {
        available.push({
            date: i,
            num: 0
        });
    }

    let schedule = db.any(profile_availableSQL);

    for (i in schedule) {
        let date = 0;
        let pos1 = 0;
        let pos2 = 0;
        while (date < 21) {
            let pos1 = schedule[i].available_time.indexOf("true",pos1);
            let pos2 = schedule[i].available_time.indexOf("true",pos2);
            pos1 += 1;
            pos2 += 1;
            if(pos1 < pos2) {
                available[date].num += 1;
                pos2 = pos1;
            }
            else {
                pos1 = pos2;
            }
            date += 1;
        }
    }
    available.sort(function(a, b){return a.num < b.num});
    let availableTop = available.slice(0,5);

    return db.one(ideasSQL, [i_id, likeCount.count, editorState, likeState, availableTop]);
}


function comeUpWith (fb_id, idea_type, skill, goal, web_url, image_url) {
    const ideasSQL = `
        INSERT INTO ideas ($<this:name>)
        VALUES (
            $<idea_type>,
            $<skill>,
            $<goal>,
            $<web_url>,
            $<image_url>
        )
        RETURNING id;
    `;

    const comeUpWithSQL = `
        INSERT INTO come_up_with
        SELECT profiles.id, ideas.id
        FROM profiles, ideas
        WHERE $1 = profiles.fb_userid AND $2 = ideas.id;
    `;

    return db.one(ideasSQL,{idea_type, skill, goal, web_url, image_url})
    .then(ideas => {
        db.one(comeUpWithSQL, [fb_id, ideas.id])
        return ideas.id;
    })
}

module.exports = {
    show,
    comeUpWith
};
