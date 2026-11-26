-- Design answers under the prompt's own headings (T-699). Prompts in the routine form have eight
-- headings, so answers are stored as one JSON object of heading -> text. Rows saved before this
-- change keep their four text columns, which become optional.
ALTER TABLE design_attempt ADD COLUMN sections jsonb;
ALTER TABLE design_attempt ALTER COLUMN requirements DROP NOT NULL;
ALTER TABLE design_attempt ALTER COLUMN estimate DROP NOT NULL;
ALTER TABLE design_attempt ALTER COLUMN components DROP NOT NULL;
ALTER TABLE design_attempt ALTER COLUMN failure DROP NOT NULL;
ALTER TABLE design_attempt ADD CONSTRAINT design_attempt_has_answer
    CHECK (sections IS NOT NULL OR requirements IS NOT NULL);
