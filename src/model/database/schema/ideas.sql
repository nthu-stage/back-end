CREATE TYPE idea_type AS ENUM (
    'teach',
    'learn'
);
CREATE TABLE ideas (
    id         serial PRIMARY KEY NOT NULL,
    idea_type  idea_type NOT NULL,
    skill      text      NOT NULL DEFAULT '',
    goal       text      NOT NULL DEFAULT '',
    web_url    text      NOT NULL DEFAULT '',
    image_url  text      NOT NULL DEFAULT '',
    created_at bigint    NOT NULL DEFAULT (extract(epoch from now())*1000),
    updated_at bigint    NOT NULL DEFAULT (extract(epoch from now())*1000)
);
CREATE INDEX ideas_idx_created_at ON ideas USING btree(created_at);
CREATE INDEX ideas_idx_updated_at ON ideas USING btree(updated_at);
CREATE INDEX ideas_idx_skill      ON ideas USING gin(skill gin_trgm_ops);
CREATE INDEX ideas_idx_goal       ON ideas USING gin(goal gin_trgm_ops);
