-- Graded attempts (T-206, FR-05.6). The id is chosen by the client, which makes a retried
-- submission return the stored result instead of being graded and rewarded twice (NFR-09).
CREATE TABLE attempt (
    id            uuid PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES app_user (id),
    problem_id    text        NOT NULL,
    mode          text        NOT NULL,
    explanation   text        NOT NULL,
    pattern       int         NOT NULL,
    steps         int         NOT NULL,
    complexity    int         NOT NULL,
    edge_cases    int         NOT NULL,
    total         int         NOT NULL,
    feedback      text        NOT NULL,
    hints_used    int         NOT NULL,
    seconds_taken int         NOT NULL,
    xp_gained     int         NOT NULL,
    grader        text        NOT NULL,
    grading_ms    int         NOT NULL,
    created_at    timestamptz NOT NULL
);

CREATE INDEX attempt_user_problem ON attempt (user_id, problem_id, created_at DESC);
CREATE INDEX attempt_created_at ON attempt (created_at DESC);
