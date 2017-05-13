require('../../config.js');
const pgp = require('pg-promise')();
const db = pgp(process.env.DB_URL);

const schemaProfileSql = `
-- [profiles]
-- Drop
DROP INDEX IF EXISTS profiles_idx_created_at;
DROP INDEX IF EXISTS profiles_idx_updated_at;
DROP TABLE IF EXISTS profiles;
DROP TYPE  IF EXISTS authority;
-- CREATE
CREATE TYPE authority AS ENUM (
    'user',
    'admin'
);
CREATE TABLE profiles (
    id              serial PRIMARY KEY NOT NULL,
    name            text NOT NULL,
    email           text NOT NULL,
    fb_userid       text NOT NULL,
    photo           text NOT NULL,
    authority       authority NOT NULL,
    available_time  text NOT NULL,
    last_login_time bigint NOT NULL DEFAULT (extract(epoch from now())),
    created_at      bigint NOT NULL DEFAULT (extract(epoch from now())),
    updated_at      bigint NOT NULL DEFAULT (extract(epoch from now()))
);
CREATE INDEX profiles_idx_created_at ON profiles USING btree(created_at);
CREATE INDEX profiles_idx_updated_at ON profiles USING btree(updated_at);
`;

const schemaWorkshopSql = `
-- [workshops]
-- Drop
DROP TABLE IF EXISTS workshops;
DROP TYPE IF EXISTS state;
CREATE TYPE state AS ENUM (
    'judging',
    'judge_fail',
    'investigation',
    'reached',
    'unreached',
    'finish'
);
CREATE TABLE workshops (
    id                  serial PRIMARY KEY NOT NULL,
    image_url           text,
    title               text NOT NULL,
    start_datetime      bigint NOT NULL DEFAULT (extract(epoch from now())),
    end_datetime        bigint NOT NULL DEFAULT (extract(epoch from now())),
    min_number          integer NOT NULL DEFAULT 0,
    max_number          integer NOT NULL DEFAULT 0,
    deadline            bigint NOT NULL DEFAULT (extract(epoch from now())),
    location            text NOT NULL,
    introduction        text NOT NULL DEFAULT '',
    content             text NOT NULL DEFAULT '',
    state               state NOT NULL,
    price               integer NOT NULL DEFAULT 0,
    created_at           bigint NOT NULL DEFAULT (extract(epoch from now())),
    updated_at           bigint NOT NULL DEFAULT (extract(epoch from now()))
);
`;

const schemaIdeaSql = `
-- [ideas]
-- Drop
DROP INDEX IF EXISTS ideas_idx_created_at;
DROP INDEX IF EXISTS ideas_idx_updated_at;
DROP INDEX IF EXISTS ideas_idx_skill;
DROP INDEX IF EXISTS ideas_idx_goal;
DROP TABLE IF EXISTS ideas;
DROP TYPE  IF EXISTS ideas_type;
-- CREATE
CREATE TYPE ideas_type AS ENUM (
    'teach',
    'learn'
);
CREATE TABLE ideas (
    id         serial PRIMARY KEY NOT NULL,
    ideas_type  ideas_type NOT NULL,
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
-- Drop
DROP TABLE IF EXISTS come_ups;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS propose;
DROP TABLE IF EXISTS attend;
-- Create
CREATE TABLE come_ups (
    profile_id          integer NOT NULL DEFAULT 0,
    idea_id             integer NOT NULL DEFAULT 0
);
CREATE TABLE likes (
    profile_id          integer NOT NULL DEFAULT 0,
    idea_id             integer NOT NULL DEFAULT 0
);
CREATE TABLE propose (
    profile_id          integer NOT NULL DEFAULT 0,
    workshop_id         integer NOT NULL DEFAULT 0
);
CREATE TABLE attend (
    profile_id          integer NOT NULL DEFAULT 0,
    workshop_id         integer NOT NULL DEFAULT 0
);
`;

const schemaSql = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
${schemaProfileSql}
${schemaIdeaSql}
${schemaWorkshopSql}
${schemaForeignSql}
`;

const dataSql = `
`;

db.none(schemaSql).then(() => {
    console.log('Schema created');
}).catch(err => {
    console.log('Error creating schema', err);
});
