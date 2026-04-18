-- ============================================================
-- Replace study_years (numeric, low signal) with study_background.
-- 3 years in B3 lukio and 3 years in a Spanish-speaking household
-- are very different starting points — the category captures that.
-- ============================================================

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS study_background TEXT;

ALTER TABLE user_profile
  DROP CONSTRAINT IF EXISTS user_profile_study_background_check;

ALTER TABLE user_profile
  ADD CONSTRAINT user_profile_study_background_check
    CHECK (
      study_background IS NULL OR study_background IN (
        'lukio',
        'ylakoulu_lukio',
        'alakoulu',
        'asunut',
        'kotikieli'
      )
    );

ALTER TABLE user_profile
  DROP COLUMN IF EXISTS study_years;
