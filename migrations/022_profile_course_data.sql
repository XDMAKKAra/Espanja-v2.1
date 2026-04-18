-- ============================================================
-- Onboarding step 2 split: courses completed + grade average
-- Replaces single "current school grade" question.
-- Either column may be NULL when the user answers "En tiedä".
-- ============================================================

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS spanish_courses_completed INT,
  ADD COLUMN IF NOT EXISTS spanish_grade_average INT;

-- Guardrails matching the onboarding answer options.
ALTER TABLE user_profile
  ADD CONSTRAINT user_profile_spanish_courses_range
    CHECK (spanish_courses_completed IS NULL OR spanish_courses_completed BETWEEN 1 AND 8);

ALTER TABLE user_profile
  ADD CONSTRAINT user_profile_spanish_grade_range
    CHECK (spanish_grade_average IS NULL OR spanish_grade_average BETWEEN 4 AND 10);
