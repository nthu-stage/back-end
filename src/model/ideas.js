if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}
const {
    get_p_id,
    get_fb_friends,
    query_values,
} = require('../fn.js');

// ===[common sql]===
// {fb_id} => {p_id}
const fb_2_pID_sql = `SELECT id FROM profiles WHERE fb_userid=$(fb_id)`;
// {p_id, i_id} => {is_author}, then check whether is_author == "1"
const check_author_sql = `
SELECT COUNT(*) AS is_author FROM come_up_withs WHERE profile_id=$(p_id) AND idea_id=$(i_id)
`;

function list(searchText, order, fb_id, start) {
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
    ideas.id AS id, COUNT(likes.profile_id) AS like_number
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
    LIMIT 8 OFFSET ($3)
    `;

    return db.task(t => {
        return t.any(fb_2_pID_sql, {fb_id}).then(( [{id: p_id=0}={}]=[] ) => {
            return t.any(sql, [p_id, searchText, start]);
        });
    });
}

function show (i_id, fb_id) {
    var p_id;

    function adapter (idea) {
        idea.like_number = +idea.like_number;
        if (idea.liked === null) idea.liked = false;
        return idea;
    }

    const idea_friends_sql = `
    SELECT id AS p_id, name, picture_url
    FROM profiles
    WHERE id IN $(friends:raw)
    `;

    const schedules_sql = `
    SELECT available_time
    FROM profiles
    INNER JOIN likes
    ON profiles.id = likes.profile_id
    WHERE likes.idea_id = $(i_id);
    `;

    const ideas_sql = `
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
        bool_and(come_up_withs.profile_id = $(p_id)) as "isEditor",
        bool_or(l1.profile_id = $(p_id)) as liked
    FROM ideas as i
    INNER JOIN come_up_withs
    on come_up_withs.idea_id = i.id AND i.id = $(i_id)
    INNER JOIN profiles
    on profiles.id = come_up_withs.profile_id
    LEFT JOIN likes l1
    on l1.idea_id = $(i_id)
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

    function source(index, data, delay) {
        function schedule_addition (xs, ys) {
            return xs.map((x, index) => ({
                time: index,
                people: x.people + ys[index].people
            }));
        }
        switch (index) {
            case 0: {
                let empty_schedule=[];
                for (let i=0; i<21; i++) {
                    empty_schedule.push({
                        time: i,
                        people: 0
                    });
                }
                var ideas = this.one(ideas_sql, {i_id, p_id});
                var most_avai_time = this
                    .any(schedules_sql, {i_id})
                    .then(schedules => schedules
                            .map(x => JSON.parse(x.available_time))
                            .map(xs => xs.map((x, index) => ({time: index, people: x})))
                            .reduce(schedule_addition, empty_schedule)
                            .sort((a, b) => b.people - a.people)
                            .slice(0, 5));
                var friends = get_fb_friends
                    .call(this, fb_id)
                    .then(friends => this.any(idea_friends_sql, {friends: query_values(friends)}));
                return this.batch([ideas, most_avai_time, friends]);
            }
            case 1: {
                let [idea, most_avai_time, friends] = data;
                idea.most_avai_time = most_avai_time;
                idea.friends = friends;
                return idea;
            }
        }
    }

    return get_p_id.call(db, fb_id)
        .then(x => { p_id = x; })
        .then(() => db.tx(t => t.sequence(source, {track: true})))
        .then(data => data.slice(-1)[0])
        .then(idea => adapter(idea))
        .catch(err => { throw err.error; });
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
