if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

function show (i_id, fb_id) {

    const profile_availableSQL = `
        SELECT profiles.available_time
        FROM profiles
        INNER JOIN likes
        on likes.idea_id = $1
        AND likes.profile_id = profiles.id;
    `;

    const profilesSQL = `
        SELECT profiles.id
        FROM profiles
        WHERE profiles.fb_userid = $1;
    `;

    const ideasSQL = `
        SELECT
            i.id as i_id,
            i.ideas_type,
            i.skill,
            i.goal,
            count(l1.profile_id) as like_number,
            i.web_url,
            i.image_url,
            profiles.picture_url,
            profiles.name,
            bool_and(come_ups.profile_id = $2) as "isEditor",
            bool_or(l1.profile_id = $2) as liked,
            $3 as "mostAvaiTime"
        FROM ideas as i
        INNER JOIN profiles
        on profiles.id = $2
        INNER JOIN come_ups
        on come_ups.idea_id = i.id AND i.id = $1 AND profiles.id = $2
        LEFT JOIN likes l1
        on l1.idea_id = $1
        GROUP BY
            i.id,
            i.ideas_type,
            i.skill,
            i.goal,
            i.web_url,
            i.image_url,
            profiles.picture_url,
            profiles.name;
    `;

    return db.one(profilesSQL, fb_id)
    .then(profiles => {

        //Calculate top 5
        return db.any(profile_availableSQL, i_id)
        .then(schedule => {
            var available = [];

            for(let i=0 ; i<21 ; i++) {
                available.push({
                    date: i,
                    num: 0
                });
            }

            for(let i of schedule) {
                let count = 0;
                let time = 0;
                while(count < i.available_time.length) {
                    if(i.available_time[count] === 't') {
                        available[time].num += 1;
                        time += 1;
                    } else if(i.available_time[count] === 'f') {
                        time += 1;
                    }
                    count += 1;
                }
            }

            available.sort(function(a,b){ return b.num - a.num});

            var mostAvaiTime =  available.slice(0, 5);
            return db.one(ideasSQL, [i_id, profiles.id, mostAvaiTime]);
        })
    })
}

function comeUpWith (fb_id, ideas_type, skill, goal, web_url, image_url) {
    const ideasSQL = `
        INSERT INTO ideas ($<this:name>)
        VALUES (
            $<ideas_type>,
            $<skill>,
            $<goal>,
            $<web_url>,
            $<image_url>
        )
        RETURNING id;
    `;

    const comeUpWithSQL = `
        INSERT INTO come_ups
        SELECT profiles.id, ideas.id
        FROM profiles, ideas
        WHERE $1 = profiles.fb_userid AND $2 = ideas.id;
    `;

    return db.one(ideasSQL,{ideas_type, skill, goal, web_url, image_url})
    .then(ideas => {
        db.one(comeUpWithSQL, [fb_id, ideas.id])
        return ideas.id;
    })
}

module.exports = {
    show,
    comeUpWith
};
