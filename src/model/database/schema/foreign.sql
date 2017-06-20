-- ON DELETE CASCADE:
-- will delete all rows in the foreign table
-- that are referenced to the rows that are being deleted in the origin table
CREATE TABLE come_up_withs (
    profile_id serial REFERENCES profiles(id) ON DELETE CASCADE,
    idea_id    serial REFERENCES ideas(id)    ON DELETE CASCADE
);
CREATE TABLE likes (
    profile_id serial REFERENCES profiles(id) ON DELETE CASCADE,
    idea_id    serial REFERENCES ideas(id)    ON DELETE CASCADE,
    created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)
);
CREATE TABLE proposes (
    profile_id  serial REFERENCES profiles(id)  ON DELETE CASCADE,
    workshop_id serial REFERENCES workshops(id) ON DELETE CASCADE
);
CREATE TABLE attends (
    profile_id  serial REFERENCES profiles(id)  ON DELETE CASCADE,
    workshop_id serial REFERENCES workshops(id) ON DELETE CASCADE,
    created_at  bigint NOT NULL DEFAULT (extract(epoch from now())*1000)
);
CREATE INDEX likes_created_at   ON likes   USING btree(created_at);
CREATE INDEX attends_created_at ON attends USING btree(created_at);

