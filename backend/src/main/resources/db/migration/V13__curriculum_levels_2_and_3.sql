-- The Learning Path replaces the content of levels 2 and 3: level 2 becomes Arrays & Strings and
-- level 3 becomes Hashing (the hashing problems move from level 2 to level 3, the Two Pointers
-- problems leave the path for a later level). Progress that counts toward a level is cleared for
-- those two levels so that old XP, quick checks, and test results are not attached to new content.
-- Graded attempts, code runs, and hint use are kept as history; they are looked up by problem id,
-- and no new playable problem reuses an old id.
DELETE FROM problem_progress
WHERE level IN (2, 3) OR problem_id LIKE 'L2-%' OR problem_id LIKE 'L3-%';

DELETE FROM problem_start
WHERE problem_id LIKE 'L2-%' OR problem_id LIKE 'L3-%';

DELETE FROM quick_check
WHERE level IN (2, 3);

DELETE FROM test_answer
WHERE test_id IN (SELECT id FROM test_attempt WHERE level IN (2, 3));

DELETE FROM test_attempt
WHERE level IN (2, 3);
