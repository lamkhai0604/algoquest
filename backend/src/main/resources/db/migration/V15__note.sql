-- Personal notes (D-074, T-606). Each note belongs to one account and only that account reads it.
-- body holds the editor's document as JSON; body_text is its plain text, for search and previews.
CREATE TABLE note (
    id            uuid        PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    body          text        NOT NULL CHECK (char_length(body) <= 200000),
    body_text     text        NOT NULL CHECK (char_length(body_text) <= 100000),
    tags          text[]      NOT NULL DEFAULT '{}',
    level_number  int         NULL CHECK (level_number > 0),
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL
);

CREATE INDEX note_user_updated ON note (user_id, updated_at DESC);
