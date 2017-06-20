const pgp = require('pg-promise')({
    capSQL: true
});

const extensions_sql = 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
const drop_sql       = new pgp.QueryFile('./schema/drop.sql', {minify: true});
const profiles_sql   = new pgp.QueryFile('./schema/profiles.sql', {minify: true});
const workshops_sql  = new pgp.QueryFile('./schema/workshops.sql', {minify: true});
const ideas_sql      = new pgp.QueryFile('./schema/ideas.sql', {minify: true});
const foreign_sql    = new pgp.QueryFile('./schema/foreign.sql', {minify: true});

module.exports = pgp.helpers.concat([
    extensions_sql,
    drop_sql,
    profiles_sql,
    workshops_sql,
    ideas_sql,
    foreign_sql,
]);
