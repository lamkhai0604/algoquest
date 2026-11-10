-- Practice round (T-302, FR-09): XP from marking a solved problem Done is kept apart from the
-- problem's own XP, so each can be checked and reset on its own.
ALTER TABLE problem_progress
    ADD COLUMN practice_xp int NOT NULL DEFAULT 0 CHECK (practice_xp >= 0);
