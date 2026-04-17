-- ============================================================
-- User profile: onboarding data for personalized AI experience
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_grade TEXT,                    -- "I"/"A"/"B"/"C"/"M"/"E"/"L"/"en tiedä"
  target_grade TEXT,                     -- "B"/"C"/"M"/"E"/"L"
  exam_date DATE,                       -- when they'll take the exam
  study_years NUMERIC,                  -- 0.5 / 1 / 2 / 3 / 4
  weak_areas TEXT[],                    -- ["vocabulary","subjunctive","writing",...]
  strong_areas TEXT[],
  motivation TEXT,                      -- "grade"/"university"/"hobby"/"bilingual"
  weekly_goal_minutes INT DEFAULT 60,
  preferred_session_length INT DEFAULT 10,
  referral_source TEXT,                 -- 'friend'/'teacher'/'google'/'tiktok'/'instagram'/'other'
  summer_package_expires_at TIMESTAMPTZ, -- e.g. 2026-09-30 23:59 for summer package
  notification_preference TEXT DEFAULT 'email',  -- 'email'/'push'/'none'
  onboarding_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id);
