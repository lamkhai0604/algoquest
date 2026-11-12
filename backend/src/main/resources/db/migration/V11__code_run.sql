-- Code answers for double XP (T-401, T-402). One row per run of a player's code against the
-- hidden tests; Java rows also count against the daily Judge0 quota (D-032).
CREATE TABLE code_run (
    id          uuid        PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES app_user (id),
    problem_id  text        NOT NULL,
    language    text        NOT NULL CHECK (language IN ('javascript', 'java')),
    code        text        NOT NULL,
    passed      int         NOT NULL CHECK (passed >= 0),
    total       int         NOT NULL CHECK (total >= 0),
    xp_gained   int         NOT NULL CHECK (xp_gained >= 0),
    created_at  timestamptz NOT NULL
);

CREATE INDEX code_run_language_day ON code_run (language, created_at);
CREATE INDEX code_run_user_problem ON code_run (user_id, problem_id, created_at DESC);
