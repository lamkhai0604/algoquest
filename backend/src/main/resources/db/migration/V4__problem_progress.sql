-- Per-player state of each problem (T-203, FR-08). Level XP is the sum of xp_awarded per level.
CREATE TABLE problem_progress (
    user_id       uuid        NOT NULL REFERENCES app_user (id),
    problem_id    text        NOT NULL,
    level         int         NOT NULL,
    solved        boolean     NOT NULL,
    xp_awarded    int         NOT NULL CHECK (xp_awarded >= 0),
    code_bonus    boolean     NOT NULL DEFAULT false,
    practice_done boolean     NOT NULL DEFAULT false,
    updated_at    timestamptz NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX problem_progress_user_level ON problem_progress (user_id, level);
