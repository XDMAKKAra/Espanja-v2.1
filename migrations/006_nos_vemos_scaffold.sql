-- Nos Vemos! (LOPS21) curriculum scaffold
-- Personal study-tracker scaffolding. Stores ONLY the structural
-- metadata (book titles, Tema titles, page ranges) so that the user's app
-- can track which parts of the curriculum they have covered. No exercise
-- content, vocabulary lists, or grammar explanations from the source
-- textbooks are stored here — the user fills those in themselves as they
-- study. Source: Otava Nos Vemos! LOPS21 digital books (user is a
-- licensed reader via nova.otava.fi).

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nv_books (
  id          INT  PRIMARY KEY,                 -- 1..8 matches the book number
  title       TEXT NOT NULL,                    -- e.g. "¡Nos vemos! 1 (LOPS21)"
  curriculum  TEXT NOT NULL DEFAULT 'LOPS21',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nv_temas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id     INT  NOT NULL REFERENCES nv_books (id) ON DELETE CASCADE,
  tema_no     INT  NOT NULL,                    -- 0 = Bienvenidos, 1..4 = Tema 1..4, 5 = Repaso, 6 = Gramática
  slug        TEXT NOT NULL,                    -- short machine key, e.g. "bienvenidos", "tema-1"
  title       TEXT NOT NULL,                    -- e.g. "¡Vamos de viaje!"
  page_start  INT,                              -- nullable: some books don't ship paginated
  page_end    INT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (book_id, tema_no)
);

CREATE INDEX IF NOT EXISTS idx_nv_temas_book ON nv_temas (book_id);

-- Per-user progress: the tracker the user actually fills in as they go.
-- Notes / own vocab / own exercise answers live here — never book content.
CREATE TABLE IF NOT EXISTS nv_progress (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tema_id      UUID NOT NULL REFERENCES nv_temas (id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'not_started'
               CHECK (status IN ('not_started', 'in_progress', 'completed')),
  own_notes    TEXT,                            -- user's own study notes (never book text)
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tema_id)
);

CREATE INDEX IF NOT EXISTS idx_nv_progress_user ON nv_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_nv_progress_tema ON nv_progress (tema_id);

-- ---------------------------------------------------------------
-- Seed data: curriculum skeleton (books 1-7 captured from nova.otava.fi,
-- book 8 is a stub — fill in Tema titles/pages when available)
-- ---------------------------------------------------------------

INSERT INTO nv_books (id, title) VALUES
  (1, '¡Nos vemos! 1 (LOPS21)'),
  (2, '¡Nos vemos! 2 (LOPS21)'),
  (3, '¡Nos vemos! 3 (LOPS21)'),
  (4, '¡Nos vemos! 4 (LOPS21)'),
  (5, '¡Nos vemos! 5 (LOPS21)'),
  (6, '¡Nos vemos! 6 (LOPS21)'),
  (7, '¡Nos vemos! 7 (LOPS21)'),
  (8, '¡Nos vemos! 8 (LOPS21)')
ON CONFLICT (id) DO NOTHING;

-- Book 1
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (1, 0, 'bienvenidos', 'Bienvenidos',        6,  16),
  (1, 1, 'tema-1',      '¿Qué tal?',          17, 40),
  (1, 2, 'tema-2',      'Un café, por favor', 41, 68),
  (1, 3, 'tema-3',      '¡Hola, mamá!',       69, 102),
  (1, 4, 'tema-4',      '¡Venga, vamos!',     103, 132),
  (1, 5, 'repaso',      'Repaso',             133, 138),
  (1, 6, 'gramatica',   'Gramática',          139, 146)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 2
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (2, 0, 'bienvenidos', 'Bienvenidos',          6,   14),
  (2, 1, 'tema-1',      '¡Vamos de viaje!',     15,  52),
  (2, 2, 'tema-2',      'Sol y playa',          53,  90),
  (2, 3, 'tema-3',      'De compras',           91,  132),
  (2, 4, 'tema-4',      '¡Qué rico!',           133, 162),
  (2, 5, 'repaso',      'Repaso',               163, 174),
  (2, 6, 'gramatica',   'Gramática',            175, 189)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 3
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (3, 0, 'bienvenidos', 'Bienvenidos',        6,   14),
  (3, 1, 'tema-1',      'Mi día',             15,  48),
  (3, 2, 'tema-2',      '¡Qué fin de semana!', 49,  82),
  (3, 3, 'tema-3',      'Mi casa',            83,  114),
  (3, 4, 'tema-4',      'La vida misma',      115, 146),
  (3, 5, 'repaso',      'Repaso',             147, 156),
  (3, 6, 'gramatica',   'Gramática',          157, 176)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 4
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (4, 0, 'bienvenidos', 'Bienvenidos',                   6,   14),
  (4, 1, 'tema-1',      'Finlandia y los finlandeses',   15,  50),
  (4, 2, 'tema-2',      'Viajando por España',           51,  82),
  (4, 3, 'tema-3',      'Hispanoamérica',                83,  114),
  (4, 4, 'tema-4',      'El español por el mundo',       115, 144),
  (4, 5, 'repaso',      'Repaso',                        145, 154),
  (4, 6, 'gramatica',   'Gramática',                     155, 180)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 5
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (5, 0, 'bienvenidos', 'Bienvenidos',          6,   14),
  (5, 1, 'tema-1',      'Vida sana, mente sana', 15,  48),
  (5, 2, 'tema-2',      'Aventuras pasadas',    49,  80),
  (5, 3, 'tema-3',      '¡Cuánta historia!',    81,  118),
  (5, 4, 'tema-4',      'La buena vida',        119, 154),
  (5, 5, 'repaso',      'Repaso',               155, 164),
  (5, 6, 'gramatica',   'Gramática',            165, 195)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 6
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (6, 0, 'bienvenidos', 'Bienvenidos',                        NULL, NULL),
  (6, 1, 'tema-1',      '¡Pon música en tu vida!',            15,   46),
  (6, 2, 'tema-2',      '¡Silencio, cámara y... rodando!',    47,   82),
  (6, 3, 'tema-3',      'Por amor al arte',                   83,   120),
  (6, 4, 'tema-4',      'La lectura está de moda',            121,  152),
  (6, 5, 'repaso',      'Repaso',                             153,  162),
  (6, 6, 'gramatica',   'Gramática',                          163,  198)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 7 (no page ranges published in the digital TOC)
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (7, 0, 'bienvenidos', 'Bienvenidos',               NULL, NULL),
  (7, 1, 'tema-1',      '¡Mis estudios!',            NULL, NULL),
  (7, 2, 'tema-2',      'En busca de mi futuro',     NULL, NULL),
  (7, 3, 'tema-3',      'Ya queda menos para la uni',NULL, NULL),
  (7, 4, 'tema-4',      'Empezando mi vida laboral', NULL, NULL),
  (7, 5, 'repaso',      'Repaso',                    NULL, NULL),
  (7, 6, 'gramatica',   'Gramática',                 NULL, NULL)
ON CONFLICT (book_id, tema_no) DO NOTHING;

-- Book 8 — STUB. Fill in Tema titles/pages when available.
INSERT INTO nv_temas (book_id, tema_no, slug, title, page_start, page_end) VALUES
  (8, 0, 'bienvenidos', 'Bienvenidos',     NULL, NULL),
  (8, 1, 'tema-1',      'Tema 1 (TODO)',   NULL, NULL),
  (8, 2, 'tema-2',      'Tema 2 (TODO)',   NULL, NULL),
  (8, 3, 'tema-3',      'Tema 3 (TODO)',   NULL, NULL),
  (8, 4, 'tema-4',      'Tema 4 (TODO)',   NULL, NULL),
  (8, 5, 'repaso',      'Repaso',          NULL, NULL),
  (8, 6, 'gramatica',   'Gramática',       NULL, NULL)
ON CONFLICT (book_id, tema_no) DO NOTHING;
