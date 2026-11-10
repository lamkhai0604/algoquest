-- Level-up tests (T-303, FR-10) and server-side problem start times for the time bonus (FR-08).

-- When a player first opened a problem; the time bonus is measured from here.
CREATE TABLE problem_start (
    user_id    uuid        NOT NULL REFERENCES app_user (id),
    problem_id text        NOT NULL,
    started_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);

-- problem_ids lists the test's problems, separated by commas, in the order shown.
CREATE TABLE test_attempt (
    id           uuid PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES app_user (id),
    level        int         NOT NULL,
    problem_ids  text        NOT NULL,
    started_at   timestamptz NOT NULL,
    ends_at      timestamptz NOT NULL,
    submitted_at timestamptz,
    score        int CHECK (score BETWEEN 0 AND 100),
    CHECK ((submitted_at IS NULL) = (score IS NULL))
);

-- A player has at most one test that is not yet submitted.
CREATE UNIQUE INDEX test_attempt_one_running ON test_attempt (user_id) WHERE submitted_at IS NULL;
CREATE INDEX test_attempt_user_level ON test_attempt (user_id, level);

-- Answers are saved while the test runs and graded at submit. A changed answer loses its grade.
CREATE TABLE test_answer (
    test_id     uuid        NOT NULL REFERENCES test_attempt (id),
    problem_id  text        NOT NULL,
    explanation text        NOT NULL,
    saved_at    timestamptz NOT NULL,
    pattern     int,
    steps       int,
    complexity  int,
    edge_cases  int,
    total       int,
    feedback    text,
    PRIMARY KEY (test_id, problem_id)
);
