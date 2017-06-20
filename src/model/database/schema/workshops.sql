CREATE TABLE workshops (
    id             serial PRIMARY KEY NOT NULL,
    image_url      text    NOT NULL DEFAULT '',
    title          text    NOT NULL DEFAULT '',
    location       text    NOT NULL DEFAULT '',
    introduction   text    NOT NULL DEFAULT '',
    content        text    NOT NULL DEFAULT '',
    min_number     integer NOT NULL DEFAULT 0,
    max_number     integer NOT NULL DEFAULT 0,
    price          integer NOT NULL DEFAULT 0,
    state          state   NOT NULL DEFAULT 'judging',
    start_datetime bigint  NOT NULL DEFAULT (extract(epoch from now())*1000),
    end_datetime   bigint  NOT NULL DEFAULT (extract(epoch from now())*1000),
    deadline       bigint  NOT NULL DEFAULT (extract(epoch from now())*1000),
    pre_deadline   bigint  NOT NULL DEFAULT (extract(epoch from now())*1000),
    created_at     bigint  NOT NULL DEFAULT (extract(epoch from now())*1000),
    updated_at     bigint  NOT NULL DEFAULT (extract(epoch from now())*1000)
);
CREATE INDEX workshops_idx_created_at ON workshops USING btree(created_at);
CREATE INDEX workshops_idx_updated_at ON workshops USING btree(updated_at);
