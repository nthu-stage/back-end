const pgp = require('pg-promise')({
    capSQL: true
});

const profiles      = require('./profiles.js');
const workshops     = require('./workshops.js');
const ideas         = require('./ideas.js');
const proposes      = require('./proposes.js');
const attends       = require('./attends.js');
const come_up_withs = require('./come_up_withs.js');
const likes         = require('./likes.js');

function gen_table_queries (table_name, tables) {
    let queries = [`DELETE FROM ${table_name}`];
    queries = queries.concat(tables.datas
        .map(x => pgp.helpers.insert(x, tables.columnSet))
    );
    return queries;
}

module.exports = pgp.helpers.concat([].concat(
    gen_table_queries('profiles',      profiles),
    gen_table_queries('workshops',     workshops),
    gen_table_queries('ideas',         ideas),
    gen_table_queries('proposes',      proposes),
    gen_table_queries('attends',       attends),
    gen_table_queries('come_up_withs', come_up_withs),
    gen_table_queries('likes',         likes)
));
