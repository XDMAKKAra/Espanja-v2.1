ALTER TABLE email_preferences
  DROP COLUMN IF EXISTS d1_weakness,
  DROP COLUMN IF EXISTS d7_offer,
  DROP COLUMN IF EXISTS exam_countdown;
