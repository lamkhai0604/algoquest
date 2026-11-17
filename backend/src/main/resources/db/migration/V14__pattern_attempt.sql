-- Pattern Recognition answers (D-057, T-517). One row per answer: the approach chosen, its
-- label from the content at answer time, and the AI's grade of the written reason. Kept so the
-- Owner can review the AI's feedback during the pilot. No XP is attached to these rows.
CREATE TABLE pattern_attempt (
    id            uuid        PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES app_user (id),
    challenge_id  text        NOT NULL,
    approach_id   text        NOT NULL,
    label         text        NOT NULL CHECK (label IN ('best', 'valid', 'unsuitable')),
    explanation   text        NOT NULL,
    reason_score  int         NOT NULL CHECK (reason_score BETWEEN 0 AND 60),
    complexity    int         NOT NULL CHECK (complexity BETWEEN 0 AND 40),
    feedback      text        NOT NULL,
    grader        text        NOT NULL,
    grading_ms    int         NOT NULL CHECK (grading_ms >= 0),
    created_at    timestamptz NOT NULL
);

CREATE INDEX pattern_attempt_user_challenge ON pattern_attempt (user_id, challenge_id, created_at DESC);
CREATE INDEX pattern_attempt_created ON pattern_attempt (created_at DESC);
