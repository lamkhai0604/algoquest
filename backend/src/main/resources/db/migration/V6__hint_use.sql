-- Hints a player has opened (T-301, FR-06). Each hint of a problem is opened at most once; the
-- quota counts the rows of the last 5 hours.
CREATE TABLE hint_use (
    id          uuid PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES app_user (id),
    problem_id  text        NOT NULL,
    hint_number int         NOT NULL CHECK (hint_number BETWEEN 1 AND 3),
    used_at     timestamptz NOT NULL,
    UNIQUE (user_id, problem_id, hint_number)
);

CREATE INDEX hint_use_user_time ON hint_use (user_id, used_at DESC);
