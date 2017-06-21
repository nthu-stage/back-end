CREATE TYPE authority AS ENUM (
    'user',
    'admin'
);
CREATE TYPE state AS ENUM (
    'judging',
    'judge_na',
    'judge_ac',
    'reached',
    'unreached'
);
CREATE TABLE profiles (
    id                  serial    PRIMARY KEY  NOT     NULL,
    name                text      NOT     NULL DEFAULT '',
    email               text      NOT     NULL DEFAULT '',
    fb_userid           text      NOT     NULL DEFAULT '',
    access_token        text      NOT     NULL DEFAULT '',
    expo_push_token     text      NOT     NULL DEFAULT '',
    picture_url         text      NOT     NULL DEFAULT '',
    available_time      text      NOT     NULL DEFAULT '[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]',
    authority           authority NOT     NULL DEFAULT 'user',
    last_login_datetime bigint    NOT     NULL DEFAULT (extract(epoch from now())*1000),
    created_at          bigint    NOT     NULL DEFAULT (extract(epoch from now())*1000),
    updated_at          bigint    NOT     NULL DEFAULT (extract(epoch from now())*1000)
);
CREATE INDEX profiles_idx_created_at ON profiles USING btree(created_at);
CREATE INDEX profiles_idx_updated_at ON profiles USING btree(updated_at);
