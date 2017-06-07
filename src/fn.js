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
            console.log(`p_id: ${p_id}`);
            if (p_id === 0 && options.required) {
                const err = new Error('Cannot found this fb user in database.');
                err.status = 400;
                throw err;
            }
            return p_id;
        });
}

module.exports = {
    tsWrapper,
    get_p_id
};
