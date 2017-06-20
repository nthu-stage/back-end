const pgp = require('pg-promise')();

try {
    var DB_URL = `postgres://${process.env.RDS_USERNAME}:${process.env.RDS_PASSWORD}@${process.env.RDS_HOSTNAME}:${process.env.RDS_PORT}/${process.env.RDS_DB_NAME}`;
} catch (err) {
    console.log(err, '\n\nError configuring the project. Have you set the environment veriables?');
}
const db = pgp(DB_URL);

const dataSql = require('./data/index.js');
const schemaSql = require('./schema/index.js');

db.none(schemaSql).then(() => {
    console.log('Schema created');
    db.none(dataSql).then(() => {
        console.log('Data populated');
        pgp.end();
    }).catch(err => {
        console.log('Error populated data', err);
        pgp.end();
    });
}).catch(err => {
    console.log('Error creating schema', err);
    pgp.end();
});
