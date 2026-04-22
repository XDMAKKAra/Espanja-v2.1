-- Pass 4 Commit 8 — reading soft→hard gate.
-- First 2 reading pieces are free; after that, non-Pro users are gated.
-- Increments in routes/exercises.js via incrementReadingPieces() only when
-- the request was served to a non-Pro user (middleware sets req.isPro).

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS reading_pieces_consumed INT NOT NULL DEFAULT 0;

-- Existing rows default to 0 — all existing free users get their 2 free
-- pieces starting from the next fetch.
