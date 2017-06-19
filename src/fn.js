var FB = require('fb');
const pgp = require('pg-promise')();

function tsWrapper (object, prop) {
    if (object[prop]) {
        // object[prop] = new Date((+ object[prop])*1000).toString();
        // object[prop] = (+ object[prop])*1000;
        object[prop] = (+ object[prop]);
    } else {
        console.log(`property "${prop}" doesn't exists. (tsWrapper)`);
    }
}

function get_p_id (fb_id, options = {required: false}) {
    // get_p_id.call(db, fb_id, {required: true})
    const get_p_id_from_fb_sql = `
    SELECT id
    FROM profiles
    WHERE fb_userid=$(fb_id)
    `;
    return this
        .any(get_p_id_from_fb_sql, {fb_id})
        .then(([{id: p_id} = {id: 0}]) => {
            if (p_id === 0 && options.required) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return p_id;
        });
}

// get_fb_friends.call(db, fb_id, {required: true}) -> Promise(friends)
function get_fb_friends (fb_id, options = {required: false}) {
    // [TODO] handle expired access_token

    // any(fb_id) -> [{access_token} = {access_token=''}, ], if fb_id not exists would broke
    const get_access_token_sql = `
    SELECT access_token
    FROM profiles
    WHERE fb_userid = $(fb_id)
    `;

    function graph_api_my_friends (access_token) {
        return FB
            .api('/me/friends', {access_token})
            .then(res => {
                // console.log('res: '+JSON.stringify(res));
                // [TODO] handle paging friends
                let friends = res.data.map(user => user.id);
                // friends.push('1514864711922034');   // TODO: test only
                // console.log('friends: '+JSON.stringify(friends));
                return friends;
            });
    }

    return this
        .any(get_access_token_sql, {fb_id})
        .then( ([{access_token} = {access_token: ''}, ]) => {
            if (access_token === '' && options.required) {
                const err = new Error('empty access_token or non-existent profile with this fb_id(get_fb_friends).');
                err.status = 400;
                throw err;
            } else if (access_token === '') {
                return [];
            }
            return graph_api_my_friends(access_token);
        }).then(friends => {
            return this.batch(friends.map(fb_id => get_p_id.call(this, fb_id)));
        }).then(friends => friends.filter(x => (x !== 0)));
}

function query_values (ids) {
    // passing in query parameter
    // in sql statement, use ${values:raw}
    // notice that ids must be UNIQUE

    //! sql = "... WHERE column IN $(col:raw)"
    //! db.any(sql, {col: query_values(ids)});

    if (ids.length === 0) {
        // return an unvalid id, force where select nothing
        return '(0)';
    }
    let values = {};
    for (let id of ids) {
        values[id.toString()] = id;
    }
    return pgp.helpers.values(values);
}

module.exports = {
    tsWrapper,
    get_p_id,
    get_fb_friends,
    query_values,
};
