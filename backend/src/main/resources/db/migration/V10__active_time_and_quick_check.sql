-- Trial feedback round (T-309).

-- Active working time per problem (D-043). The solve page sends a heartbeat while it is visible;
-- the server adds the time between close heartbeats. started_at stays as the first opening.
ALTER TABLE problem_start ADD COLUMN active_seconds int NOT NULL DEFAULT 0 CHECK (active_seconds >= 0);
ALTER TABLE problem_start ADD COLUMN last_beat_at timestamptz;

-- A finished quick check per player and level, worth 5 XP once (D-041).
CREATE TABLE quick_check (
    user_id      uuid        NOT NULL REFERENCES app_user (id),
    level        int         NOT NULL,
    xp           int         NOT NULL CHECK (xp >= 0),
    completed_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, level)
);
