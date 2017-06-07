if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

// ===[common sql]===
// {fb_id} => {p_id}
const fb_2_pID_sql = `SELECT id FROM profiles WHERE fb_userid=$(fb_id)`;
// {p_id, i_id} => {is_author}, then check whether is_author == "1"
const check_author_sql = `
SELECT COUNT(*) AS is_author FROM come_up_withs WHERE profile_id=$(p_id) AND idea_id=$(i_id)
`;

function list(searchText, order, fb_id=null) {
    // [TODO]: search priority skill > goal.
    const search = ['skill', 'goal'].map(s => {
        return `${s} ILIKE '%$2:value%'`;
    });
    // $1 = p_id
    const user_likes_sql = `SELECT * FROM likes WHERE likes.profile_id = $1 `;
    const liked_sql = `
    SELECT
    ideas.id AS id, COUNT(user_likes.profile_id) AS liked
    FROM ideas
    LEFT JOIN (
        ${user_likes_sql}
    ) AS user_likes
    ON user_likes.idea_id = id
    GROUP BY ideas.id
    `;
    const like_number_sql = `
    SELECT
    ideas.id AS id, COUNt(likes.profile_id) AS like_number
    FROM ideas
    LEFT JOIN likes
    ON likes.idea_id = ideas.id
    GROUP BY ideas.id
    ORDER BY ideas.id
    `;
    const sql = `
    SELECT
    i.id AS i_id, idea_type, skill, goal, like_number, liked
    FROM ideas as i
    LEFT JOIN (
        ${liked_sql}
    ) AS liked
    ON liked.id = i.id
    LEFT JOIN (
        ${like_number_sql}
    ) AS ln
    ON ln.id = i.id
    ${searchText ? 'WHERE ' + search.join(' OR ') : ''}
    ORDER BY ${order=='hot' ? 'like_number DESC' : 'created_at DESC'}
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            return t.any(sql, [p_id, searchText]);
        });
    });
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
        i.idea_type as idea_type,
        i.skill,
        i.goal,
        count(l1.profile_id) as like_number,
        i.web_url,
        i.image_url,
        profiles.picture_url,
        profiles.name,
        bool_and(come_up_withs.profile_id = $2) as "isEditor",
        bool_or(l1.profile_id = $2) as liked
    FROM ideas as i
    INNER JOIN come_up_withs
    on come_up_withs.idea_id = i.id AND i.id = $1
    INNER JOIN profiles
    on profiles.id = come_up_withs.profile_id
    LEFT JOIN likes l1
    on l1.idea_id = $1
    GROUP BY
    i.id,
        i.idea_type,
        i.skill,
        i.goal,
        i.web_url,
        i.image_url,
        profiles.picture_url,
        profiles.name;
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            //Calculate top 5
            var mostAvaiTime = db.any(profile_availableSQL, i_id)
                .then(schedule => {
                    var available = [];

                    for(let i=0 ; i<21 ; i++) {
                        available.push({
                            time: i,
                            people: 0
                        });
                    }

                    for(let i of schedule) {
                        let count = 0;
                        let time = 0;
                        while(count < i.available_time.length) {
                            if(i.available_time[count] === 't') {
                                available[time].people += 1;
                                time += 1;
                            } else if(i.available_time[count] === 'f') {
                                time += 1;
                            }
                            count += 1;
                        }
                    }

                    available.sort(function(a,b){ return b.people - a.people; });
                    // console.log(available);
                    return available.slice(0, 5);
                });

            var ideas = db.one(ideasSQL, [i_id, p_id]);

            return Promise.all([ideas, mostAvaiTime])
                .then(([ideas, mostAvaiTime]) => {
                    ideas.mostAvaiTime = mostAvaiTime;
                    return new Promise((resolve, reject) => {
                        resolve(ideas);
                    });
                });
        });
    });
}

function comeUpWith (fb_id, idea_type, skill, goal, web_url, image_url) {
    const ideasSQL = `
    INSERT INTO ideas ($<this:name>)
    VALUES (
        $(idea_type),
        $(skill),
        $(goal),
        $(web_url),
        $(image_url)
    )
    RETURNING id as i_id;
    `;

    const comeUpWithSQL = `
    INSERT INTO come_up_withs
    SELECT profiles.id, ideas.id
    FROM profiles
    INNER JOIN ideas
    on profiles.fb_userid = $1
    AND ideas.id = $2;
    `;

    return db.one(ideasSQL,{idea_type, skill, goal, web_url, image_url})
        .then(ideas => {
            db.none(comeUpWithSQL, [fb_id, ideas.i_id]);
            return ideas;
        });
}

function like(i_id, fb_id) {
    // {i_id, like_number, liked: boolean}
    const toggle_like_sql = `
    DO
    $do$
    BEGIN
    IF (SELECT COUNT(*) FROM likes WHERE profile_id=$(p_id) AND idea_id=$(i_id)) > 0 THEN
    DELETE FROM likes WHERE profile_id=$(p_id) AND idea_id=$(i_id);
    ELSE
    INSERT INTO likes VALUES ($(p_id), $(i_id));
    END IF;
    END
    $do$;
    `;
    const liked_sql = `
    SELECT COUNT(*) AS liked
    FROM likes
    WHERE profile_id = $(p_id) AND idea_id = $(i_id)
    `;
    const like_number_sql = `
    SELECT COUNT(*) AS like_number
    FROM likes
    WHERE idea_id = $(i_id)
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id ===0 ) {
                const err = new Error('Cannot found this fb user in database');
                err.status = 400;
                throw err;
            }
            return t.none(toggle_like_sql, {p_id, i_id}).then(() => {
                var liked = t.one(liked_sql, {p_id, i_id});
                var like_number = t.one(like_number_sql, {i_id});
                return Promise.all([liked, like_number]).then(([{liked}, {like_number}]) => {
                    return new Promise((resolve, reject) => {
                        resolve({i_id, liked: liked==="1", like_number});
                    });
                });
            });
        });
    });
}

function remove(i_id, fb_id) {
    const delete_idea_sql = `
    DELETE FROM ideas
    WHERE id=$(i_id)
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id === 0 ) {
                const err = new Error('Cannot found this fb user in database');
                err.status = 400;
                throw err;
            }
            return t.one(check_author_sql, {p_id, i_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match profile and idea: not author or idea does not exist');
                    err.status = 400;
                    throw err;
                }
                return t.none(delete_idea_sql, {i_id});
            });
        });
    });
}

function update(i_id, fb_id, skill, goal, web_url, image_url) {
    //[X]: only author can update: check whether p_id match i_id in come_up_withs table.
    //[X]: idea : must exist, if user is author.
    //[X]: update.

    //[TODO]: admin can update, too.

    const update_idea_sql = `
    UPDATE ideas
    SET
    skill     = $(skill),
        goal      = $(goal),
        web_url   = $(web_url),
        image_url = $(image_url)
    WHERE id=$(i_id)
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            if (p_id === 0 ) {
                const err = new Error('Cannot found this fb user in database');
                err.status = 400;
                throw err;
            }
            return t.one(check_author_sql, {p_id, i_id}).then(( {is_author} ) => {
                if (is_author == "0") {
                    const err = new Error('Cannot match profile and idea: not author or idea does not exist');
                    err.status = 400;
                    throw err;
                }
                return t.none(update_idea_sql, {i_id, skill, goal, web_url, image_url});
            });
        });
    });
}

module.exports = {
    show,
    comeUpWith,
    list,
    like,
    update,
    remove,
};
