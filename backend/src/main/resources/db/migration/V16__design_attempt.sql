-- Design prompt answers (D-085, T-657). One row per graded design: the learner's four sections,
-- the AI's score in each rubric category, and its feedback. Kept so the Owner can review the AI's
-- grading during the pilot. No XP is attached to these rows.
CREATE TABLE design_attempt (
    id            uuid        PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES app_user (id),
    prompt_id     text        NOT NULL,
    requirements  text        NOT NULL,
    estimate      text        NOT NULL,
    components    text        NOT NULL,
    failure       text        NOT NULL,
    score_requirements int    NOT NULL CHECK (score_requirements BETWEEN 0 AND 20),
    score_estimation   int    NOT NULL CHECK (score_estimation BETWEEN 0 AND 15),
    score_design       int    NOT NULL CHECK (score_design BETWEEN 0 AND 25),
    score_data         int    NOT NULL CHECK (score_data BETWEEN 0 AND 20),
    score_tradeoffs    int    NOT NULL CHECK (score_tradeoffs BETWEEN 0 AND 20),
    strengths     text        NOT NULL,
    improve       text        NOT NULL,
    grader        text        NOT NULL,
    grading_ms    int         NOT NULL CHECK (grading_ms >= 0),
    created_at    timestamptz NOT NULL
);

CREATE INDEX design_attempt_user_prompt ON design_attempt (user_id, prompt_id, created_at DESC);
CREATE INDEX design_attempt_created ON design_attempt (created_at DESC);
