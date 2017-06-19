if (!global.db) {
    const pgp = require('pg-promise')();
    db = pgp(process.env.DB_URL);
}

const {
    get_p_id,
    get_fb_friends,
    query_values,
} = require('../fn.js');

/////////////////
//  API below  //
/////////////////

function list(fb_id) {
    // [TODO] query with pagination
    // [TODO] get news within ? days

    function n_days_ago (n) {
        const now = new Date(Date.now());
        return +now.setDate(now.getDate() - n);
    }

    function news_wrapper (single_news) {
        single_news.created_at = +single_news.created_at;
        return single_news;
    }

    // any(fb_id) -> [{access_token} = {access_token=''}, ], if fb_id not exists would broke
    const get_access_token_sql = `
    SELECT access_token
    FROM profiles
    WHERE fb_userid = $(fb_id)
    `;

    const propose_sql = `
    SELECT name,
        picture_url,
        'propose' AS action,
        title AS target,
        workshops.id AS target_id,
        workshops.created_at
    FROM proposes
    INNER JOIN profiles
    ON profiles.id = profile_id
    INNER JOIN workshops
    ON workshops.id = workshop_id
    WHERE profiles.id IN $(friends:raw)
    AND workshops.created_at > $(from)
    `;

    const attend_sql = `
    SELECT name,
        picture_url,
        'attend' AS action,
        title AS targer,
        workshops.id AS target_id,
        attends.created_at
    FROM attends
    INNER JOIN profiles
    ON profiles.id = profile_id
    INNER JOIN workshops
    ON workshops.id = workshop_id
    WHERE profiles.id IN $(friends:raw)
    AND attends.created_at > $(from)
    `;

    const come_up_with_sql = `
    SELECT name,
        picture_url,
        'come_up_with' AS action,
        skill AS target,
        ideas.id AS target_id,
        ideas.created_at
    FROM come_up_withs
    INNER JOIN profiles
    ON profiles.id = profile_id
    INNER JOIN ideas
    ON ideas.id = idea_id
    WHERE profiles.id IN $(friends:raw)
    AND ideas.created_at > $(from)
    `;

    const like_sql = `
    SELECT name,
        picture_url,
        'like' AS action,
        skill AS target,
        ideas.id AS target_id,
        likes.created_at
    FROM likes
    INNER JOIN profiles
    ON profiles.id = profile_id
    INNER JOIN ideas
    ON ideas.id = idea_id
    WHERE profiles.id IN $(friends:raw)
    AND likes.created_at > $(from)
    `;

    // any(friends, from) -> news
    const sql = `
    SELECT name, picture_url, action, target, target_id, created_at
    FROM  (${propose_sql}) AS propose
    UNION (${attend_sql})
    UNION (${come_up_with_sql})
    UNION (${like_sql})
    ORDER BY created_at DESC
    `;

    function source(index, data, delay) {
        // console.log(`source(${index}, ${JSON.stringify(data)})`);
        switch (index) {
            case 0: {
                return get_fb_friends.call(this, fb_id);
            }
            case 1: {
                const friends = data;
                return this.any(sql, {
                    friends: query_values(friends),
                    from: n_days_ago(7)
                });
            }
        }
    }

    return db
        .tx(t => t.sequence(source, {track: true}))
        .then(data => data.slice(-1)[0])
        .then(news => news.map(news_wrapper))
        .catch(err => { throw err.error; });
}

module.exports = {
    list,
};