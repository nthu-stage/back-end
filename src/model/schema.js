require('../../config.js');
const pgp = require('pg-promise')();
const db = pgp(process.env.DB_URL);

const drop_schema_sql = `
-- Drop
DROP TABLE IF EXISTS come_up_withs;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS proposes;
DROP TABLE IF EXISTS attends;
-- Drop
DROP INDEX IF EXISTS profiles_idx_created_at;
DROP INDEX IF EXISTS profiles_idx_updated_at;
DROP TABLE IF EXISTS profiles;
DROP TYPE  IF EXISTS authority;
-- Drop
DROP TABLE IF EXISTS workshops;
DROP TYPE IF EXISTS phase;
CREATE TYPE phase AS ENUM (
    'judging',
    'judge_na',
    'investigating',
    'unreached',
    'reached',
    'over'
);
-- Drop
DROP INDEX IF EXISTS ideas_idx_created_at;
DROP INDEX IF EXISTS ideas_idx_updated_at;
DROP INDEX IF EXISTS ideas_idx_skill;
DROP INDEX IF EXISTS ideas_idx_goal;
DROP TABLE IF EXISTS ideas;
DROP TYPE  IF EXISTS idea_type;
`;


const schemaProfileSql = `
-- [profiles]
-- CREATE
CREATE TYPE authority AS ENUM (
    'user',
    'admin'
);
CREATE TABLE profiles (
    id                  serial PRIMARY KEY NOT NULL,
    name                text NOT NULL,
    email               text NOT NULL,
    fb_userid           text NOT NULL,
    picture_url         text NOT NULL,
    authority           authority NOT NULL,
    available_time      text NOT NULL,
    last_login_datetime bigint NOT NULL DEFAULT (extract(epoch from now())),
    created_at          bigint NOT NULL DEFAULT (extract(epoch from now())),
    updated_at          bigint NOT NULL DEFAULT (extract(epoch from now()))
);
CREATE INDEX profiles_idx_created_at ON profiles USING btree(created_at);
CREATE INDEX profiles_idx_updated_at ON profiles USING btree(updated_at);
`;

const schemaWorkshopSql = `
-- [workshops]
CREATE TABLE workshops (
    id                  serial PRIMARY KEY NOT NULL,
    image_url           text,
    title               text NOT NULL,
    start_datetime      bigint NOT NULL DEFAULT (extract(epoch from now())),
    end_datetime        bigint NOT NULL DEFAULT (extract(epoch from now())),
    min_number          integer NOT NULL DEFAULT 0,
    max_number          integer NOT NULL DEFAULT 0,
    deadline            bigint NOT NULL DEFAULT (extract(epoch from now())),
    pre_deadline        bigint NOT NULL DEFAULT (extract(epoch from now())),
    location            text NOT NULL,
    introduction        text NOT NULL DEFAULT '',
    content             text NOT NULL DEFAULT '',
    phase               phase NOT NULL,
    price               integer NOT NULL DEFAULT 0,
    created_at          bigint NOT NULL DEFAULT (extract(epoch from now())),
    updated_at          bigint NOT NULL DEFAULT (extract(epoch from now()))
);
`;

const schemaIdeaSql = `
-- [ideas]
-- CREATE
CREATE TYPE idea_type AS ENUM (
    'teach',
    'learn'
);
CREATE TABLE ideas (
    id         serial PRIMARY KEY NOT NULL,
    idea_type  idea_type NOT NULL,
    skill      text NOT NULL,
    goal       text NOT NULL,
    web_url    text,
    image_url  text,
    created_at bigint NOT NULL DEFAULT (extract(epoch from now())),
    updated_at bigint NOT NULL DEFAULT (extract(epoch from now()))
);
CREATE INDEX ideas_idx_created_at ON ideas USING btree(created_at);
CREATE INDEX ideas_idx_updated_at ON ideas USING btree(updated_at);
CREATE INDEX ideas_idx_skill      ON ideas USING gin(skill gin_trgm_ops);
CREATE INDEX ideas_idx_goal       ON ideas USING gin(goal gin_trgm_ops);
`;

const schemaForeignSql = `
-- [foreign]
-- ON DELETE CASCADE:
-- will delete all rows in the foreign table
-- that are referenced to the rows that are being deleted in the origin table
-- Create
CREATE TABLE come_up_withs (
    profile_id          serial REFERENCES profiles(id) ON DELETE CASCADE,
    idea_id             serial REFERENCES ideas(id) ON DELETE CASCADE
);
CREATE TABLE likes (
    profile_id          serial REFERENCES profiles(id) ON DELETE CASCADE,
    idea_id             serial REFERENCES ideas(id) ON DELETE CASCADE
);
CREATE TABLE proposes (
    profile_id          serial REFERENCES profiles(id) ON DELETE CASCADE,
    workshop_id         serial REFERENCES workshops(id) ON DELETE CASCADE
);
CREATE TABLE attends (
    profile_id          serial REFERENCES profiles(id) ON DELETE CASCADE,
    workshop_id         serial REFERENCES workshops(id) ON DELETE CASCADE
);
`;

const schemaSql = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
${drop_schema_sql}
${schemaProfileSql}
${schemaIdeaSql}
${schemaWorkshopSql}
${schemaForeignSql}
`;

function genRandomAvaiTime() {
    var avai_time = new Array(21);
    for (let i=0; i<21; i++) {
        avai_time[i] = Math.random() < 0.5;
    }
    return avai_time;
}

function genDummyProfiles() {
    const n = 7;
    const names = ['Apple', 'Bike', 'Car', 'Dog', 'Ear', 'Race', 'Rust'];
    const fb_suerids = ['1514864711922034', '1833867746937550', '1234', '9527', '1036', '9487', '9062']
    var sql = new String();
    for (let i=0; i<n; i++) {
       sql += `
INSERT INTO profiles(
    name,
    email,
    fb_userid,
    picture_url,
    authority,
    available_time,
    last_login_datetime,
    created_at,
    updated_at
)
VALUES(
    '${names[i]}',
    '${names[i]}@domain.com',
    '${fb_suerids[i]}',
    '${names[i]}_photo_url',
    'user',
    '${genRandomAvaiTime()}',
    ${Date.now()/1000 + (i-n)*3600},
    ${Date.now()/1000 + (i-n)*3600},
    ${Date.now()/1000 + (i-n)*3600}
);
    `;
    }
    return sql;
}

function genDummyWorkshops() {
    const n = 5;
    const titles=['React', 'Git', 'Archi', 'Linux', 'Stage'];
    const locations=['London','Tokyo','Rome','Taipei','Hsinchu'];
    const phases=[ 'judging', 'judge_na', 'investigating', 'unreached', 'reached', 'over' ];
    var sql = new String();
    for (let i=0; i<n; i++) {
       sql += `
INSERT INTO workshops(
    title,
    start_datetime,
    end_datetime,
    min_number,
    max_number,
    deadline,
    pre_deadline,
    location,
    phase,
    price,
    created_at,
    updated_at
)
VALUES(
    '${titles[i]}',
    ${Date.now()/1000 + (i-n)*3600 + 72000},
    ${Date.now()/1000 + (i-n)*3600 + 90000},
    ${Math.floor(Math.random() * 10)},
    ${Math.floor(Math.random() * 30)+10},
    ${Date.now()/1000 + (i-n)*3600 + 36000},
    ${Date.now()/1000 + (i-n)*3600 + 36000},
    '${locations[i]}',
    '${phases[i]}',
    ${Math.random() * 100},
    ${Date.now()/1000},
    ${Date.now()/1000}
);
    `;
    }
    return sql;
}


function genDummyIdeas() {
    const n = 8;
    const idea_types = ['learn', 'teach'];
    const skills=['Fire', 'Desire', 'Gun', 'Radio', 'Piano', 'Skin', 'Spot', 'Silence'];
    const goals=['Burn', 'Death', 'Shoot', 'Sound', 'Melody', 'Touch', 'View', 'Noise'];
    var sql = new String();
    for (let i=0; i<n; i++) {
       sql += `
INSERT INTO ideas(
    idea_type,
    skill,
    goal,
    web_url,
    image_url,
    created_at,
    updated_at
)
VALUES(
    '${idea_types[Math.floor(Math.random()*2)]}',
    '${skills[i]}',
    '${goals[i]}',
    'some_web_url',
    'some_image_url',
    ${Date.now()/1000 + (i-n)*3600 + 36000},
    ${Date.now()/1000 + (i-n)*3600 + 36000}
);
    `;
    }
    return sql;
}

function genProposeTable() {
    // all workshop need to be created by someone
    var sql = new String();
    const ps = [5, 1, 2, 6, 4];
    for (let i=0; i<5; i++) {
        sql+=`
        INSERT INTO proposes VALUES(
        ${ps[i]},   -- profile_id
        ${i+1}      -- workshop_id
        );
        `;
    }
    return sql;
}

function genAttendTable() {
    // one profile could attends multiple workshop
    var sql = new String();
    // profile 2 attends nothing
    // noeone want to attends workshop 3
    const ary = [
        [1, 1], [1, 3], [1, 5],
        [3, 2], [3, 4], [3, 5],
        [4, 1], [4, 5],
        [6, 1], [6, 2], [6, 4],
        [7, 2], [7, 4], [7, 5],
    ];
    for (let [p, w] of ary) {
        sql+=`
        INSERT INTO attends VALUES(
        ${p},
        ${w}
        );
        `;
    }
    return sql;
}

function genLikeTable() {
    // one profile could attends multiple workshop
    var sql = new String();
    // profile 5 dont likes anyone
    // noone likes idea 7
    const ary = [
        [1, 1], [1, 3], [1, 5], [1, 8],
        [2, 2], [2, 4], [2, 6], [2, 8],
        [3, 2], [3, 3], [3, 4],
        [4, 1], [4, 5],
        [6, 1], [6, 4], [6, 8],
        [7, 3], [7, 6], [7, 5],
    ];
    for (let [p, i] of ary) {
        sql+=`
        INSERT INTO likes VALUES(
        ${p},
        ${i}
        );
        `;
    }
    return sql;
}

function genComeUpWithTable() {
    // all idea need to be created by someone
    var sql = new String();
    for (let i=0; i<8; i++) {
        sql+=`
        INSERT INTO come_up_withs VALUES(
        ${Math.floor(Math.random()*7)+1},
        ${i+1}
        );
        `;
    }
    return sql;
}

const dataSql = `
${genDummyProfiles()}
${genDummyWorkshops()}
${genDummyIdeas()}
${genProposeTable()}
${genAttendTable()}
${genLikeTable()}
${genComeUpWithTable()}
`;

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
