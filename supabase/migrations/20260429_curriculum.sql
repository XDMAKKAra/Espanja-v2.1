-- L-PLAN-2: Curriculum tables + seed data
-- Source of truth: CURRICULUM_SPEC.md §3 + §8.
-- Apply via Supabase SQL editor or `supabase db push`.

-- ─── 1. Tables ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS curriculum_kurssit (
  key            text PRIMARY KEY,
  title          text NOT NULL,
  description    text,
  level          text NOT NULL,
  vocab_theme    text,
  grammar_focus  text[],
  lesson_count   int NOT NULL,
  sort_order     int NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id             serial PRIMARY KEY,
  kurssi_key     text REFERENCES curriculum_kurssit(key) ON DELETE CASCADE,
  sort_order     int NOT NULL,
  type           text NOT NULL,
  focus          text NOT NULL,
  exercise_count int NOT NULL DEFAULT 8,
  teaching_snippet text,
  UNIQUE (kurssi_key, sort_order)
);

CREATE TABLE IF NOT EXISTS teaching_pages (
  topic_key      text PRIMARY KEY,
  content_md     text NOT NULL,
  generated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_curriculum_progress (
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kurssi_key     text REFERENCES curriculum_kurssit(key) ON DELETE CASCADE,
  lesson_index   int NOT NULL,
  completed_at   timestamptz DEFAULT now(),
  score_correct  int,
  score_total    int,
  PRIMARY KEY (user_id, kurssi_key, lesson_index)
);

CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_user
  ON user_curriculum_progress (user_id);

-- L-PLAN-1 deferred user_profile columns (silently no-op'd in prod until now).
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS self_reported_grade  text,
  ADD COLUMN IF NOT EXISTS target_grade         text,
  ADD COLUMN IF NOT EXISTS weak_areas           text[],
  ADD COLUMN IF NOT EXISTS daily_goal_minutes   int DEFAULT 20,
  ADD COLUMN IF NOT EXISTS placement_confidence text,
  ADD COLUMN IF NOT EXISTS placement_kurssi     text,
  ADD COLUMN IF NOT EXISTS tutor_assessment     text,
  -- L-PLAN-3 — daily-cached dashboard greeting + last-generated timestamp.
  ADD COLUMN IF NOT EXISTS tutor_greeting       text,
  ADD COLUMN IF NOT EXISTS tutor_greeting_at    timestamptz;

-- ─── 2. Seed: kurssit ──────────────────────────────────────────────────────

INSERT INTO curriculum_kurssit (key, title, description, level, vocab_theme, grammar_focus, lesson_count, sort_order) VALUES
  ('kurssi_1', 'Kurssi 1 — Kuka olen',                'Preesens säännölliset, ser/estar perusteet, persoona ja perhe.',                          'A', 'general vocabulary',     ARRAY['present_regular']::text[],                              10, 1),
  ('kurssi_2', 'Kurssi 2 — Arki ja elämä',            'Preesens epäsäännölliset, gustar-rakenne, koti ja ruoka.',                                'A', 'general vocabulary',     ARRAY['present_irregular']::text[],                            10, 2),
  ('kurssi_3', 'Kurssi 3 — Mitä tein',                'Preteriti säännölliset ja yleisimmät epäsäännölliset, matkustamisen sanasto.',            'B', 'travel and transport',   ARRAY['preterite']::text[],                                    11, 3),
  ('kurssi_4', 'Kurssi 4 — Ennen ja nyt',             'Imperfekti ja preteriti vs imperfekti — YO-klassikko, lapsuus ja muistot.',               'B', 'environment and nature', ARRAY['imperfect','preterite_vs_imperfect']::text[],           12, 4),
  ('kurssi_5', 'Kurssi 5 — Tulevaisuus ja unelmat',   'Futuuri ja konditionaali, työ ja teknologia.',                                            'C', 'work and economy',       ARRAY['future','conditional']::text[],                         11, 5),
  ('kurssi_6', 'Kurssi 6 — Maailman ongelmat',        'Subjunktiivin preesens (ojalá, es importante que), ympäristö ja yhteiskunta.',            'C', 'society and politics',   ARRAY['subjunctive_present']::text[],                          12, 6),
  ('kurssi_7', 'Kurssi 7 — Kulttuuri ja yhteiskunta', 'Subjunktiivi syvemmin, pluskvamperfekti, kulttuuri ja media.',                            'M', 'culture and arts',       ARRAY['subjunctive_present','pluscuamperfecto']::text[],       12, 7),
  ('kurssi_8', 'Kurssi 8 — YO-koevalmiiksi',          'Subjunktiivi imperfekti (si tuviera), kaikkien rakenteiden kertaus, YO-tyyppiset tehtävät.', 'E', 'general vocabulary',     ARRAY['subjunctive_imperfect']::text[],                        12, 8)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  vocab_theme = EXCLUDED.vocab_theme,
  grammar_focus = EXCLUDED.grammar_focus,
  lesson_count = EXCLUDED.lesson_count,
  sort_order = EXCLUDED.sort_order;

-- ─── 3. Seed: lessons ──────────────────────────────────────────────────────
-- teaching_snippet pattern (worked-example fading):
--   - lesson 1 of kurssi: full worked example (espanja + suomi + selitys)
--   - lessons before kertaustesti (last 2 oppituntia): one-hint sentence only
--   - kertaustesti: "Nyt testataan mitä olet oppinut — [topic]. [X] kysymystä."

-- Wipe existing lessons before reseed (safe — we own this table fully).
DELETE FROM curriculum_lessons;

-- KURSSI 1 — "Kuka olen" (10 oppituntia, A-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_1',  1, 'vocab',   'Perhe ja kansallisuudet — perussanasto', 10, 'Aloitamme nimillä joita käytät joka päivä. Esim. "madre" = äiti, "padre" = isä, "hermano" = veli. Tunnista oikea käännös 10 sanasta.'),
  ('kurssi_1',  2, 'grammar', '-ar-verbit preesensissä — säännöllinen taivutus',  8, 'Preesens kertoo mitä teet nyt. Esim. hablar → hablo, hablas, habla, hablamos, habláis, hablan. Yksi kirjain pään perään per persoona.'),
  ('kurssi_1',  3, 'grammar', '-er- ja -ir-verbit preesensissä',                  8, 'Sama logiikka kuin -ar, mutta päätteet vaihtuvat: comer → como, comes, come. Vivir → vivo, vives, vive.'),
  ('kurssi_1',  4, 'vocab',   'Koulu ja värit',                                  10, 'Koulun arkea: "libro" = kirja, "profesor" = opettaja. Värit: rojo, azul, verde. Tunnista 10 sanaa.'),
  ('kurssi_1',  5, 'mixed',   'Ser vs estar — perusteet',                         8, 'Ser = pysyvä (Soy finlandés). Estar = ohimenevä tai paikka (Estoy cansado, Estoy en casa). Mieti aina: pysyvä vai hetkellinen?'),
  ('kurssi_1',  6, 'vocab',   'Numerot ja ikä',                                  10, 'Numerot 1–100 ja ikä-rakenne: "Tengo 17 años". Tärkeä YO-kokeessa.'),
  ('kurssi_1',  7, 'grammar', 'Ser vs estar syvemmin',                            8, 'Vihje: tunteet ja sijainti aina estar, ammatti ja kansallisuus aina ser.'),
  ('kurssi_1',  8, 'reading', 'Lyhyt teksti perheestä — luetun ymmärtäminen',     5, 'Lue lyhyt esittely perheestä ja vastaa 5 kysymykseen.'),
  ('kurssi_1',  9, 'writing', 'Kirjoita itsestäsi (50–80 sanaa)',                 1, 'Esittele itsesi: nimi, ikä, kotipaikka, perhe, harrastukset.'),
  ('kurssi_1', 10, 'test',    'Kertaustesti — Kurssi 1',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 1: preesens + ser/estar + perussanasto. 15 kysymystä.');

-- KURSSI 2 — "Arki ja elämä" (10 oppituntia, A-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_2',  1, 'vocab',   'Koti ja huonekalut',                              10, 'Tutustut kodin sanastoon: "cocina" = keittiö, "dormitorio" = makuuhuone, "mesa" = pöytä. 10 sanan tunnistus.'),
  ('kurssi_2',  2, 'grammar', 'Epäsäännölliset preesens-verbit (ser/estar/tener/ir/hacer)', 8, 'Ulkoa: tengo/tienes/tiene, voy/vas/va, hago/haces/hace. Esim. "Tengo hambre" = minulla on nälkä (kirj. minulla on nälkä).'),
  ('kurssi_2',  3, 'vocab',   'Ruoka ja ateriat',                                10, 'Aamiainen, lounas, illallinen — desayuno, comida, cena. Ruoat: pan, arroz, fruta. 10 sanan tunnistus.'),
  ('kurssi_2',  4, 'grammar', 'Gustar-rakenne ja indirekti pronominit',           8, 'Gustar toimii käänteisesti: "Me gusta el café" (kahvi miellyttää minua). Yksikkö "gusta", monikko "gustan".'),
  ('kurssi_2',  5, 'vocab',   'Vapaa-aika ja harrastukset',                      10, 'Hacer deporte, jugar al fútbol, leer, viajar. 10 harrastussanaa.'),
  ('kurssi_2',  6, 'grammar', 'Stem-changers (poder, querer, dormir)',            8, 'Vihje: o → ue (puedo, duermo), e → ie (quiero), e → i (pido). Vain "nosotros/vosotros" pysyy ennallaan.'),
  ('kurssi_2',  7, 'mixed',   'Arjen kuvaus — gustar + harrastussanasto',         8, 'Yhdistä: kerro mistä pidät ja mitä teet vapaa-ajalla.'),
  ('kurssi_2',  8, 'reading', 'Arki-aiheinen teksti — luetun ymmärtäminen',       5, 'Lue teksti tavallisesta päivästä ja vastaa 5 kysymykseen.'),
  ('kurssi_2',  9, 'writing', 'Sähköposti ystävälle (80–120 sanaa)',              1, 'Käytä gustar-rakennetta ja arjen sanastoa.'),
  ('kurssi_2', 10, 'test',    'Kertaustesti — Kurssi 2',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 2: epäsäännölliset preesens + gustar + arjen sanasto. 15 kysymystä.');

-- KURSSI 3 — "Mitä tein" (11 oppituntia, B-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_3',  1, 'vocab',   'Matkustaminen ja kulkuvälineet',                  10, 'Matkasanasto käyttöön: "tren" = juna, "avión" = lentokone, "billete" = lippu. 10 sanaa joita YO-koe rakastaa.'),
  ('kurssi_3',  2, 'grammar', 'Preteriti — säännölliset -ar-verbit',              8, 'Preteriti = mennyt yksittäinen teko. Hablar → hablé, hablaste, habló, hablamos, hablasteis, hablaron. Esim. "Ayer hablé con mi amigo".'),
  ('kurssi_3',  3, 'grammar', 'Preteriti — -er- ja -ir-verbit',                   8, 'Comer → comí, comiste, comió. Vivir → viví, viviste, vivió. -er ja -ir käyttävät samat päätteet.'),
  ('kurssi_3',  4, 'vocab',   'Hotelli ja majoitus',                             10, 'Reservar, habitación, llave, ducha. Tärkeä matkakirjoituksissa.'),
  ('kurssi_3',  5, 'grammar', 'Preteriti epäsäännölliset — ser ja ir',            8, 'Vihje: ser ja ir taipuvat samoin preteritissä → fui, fuiste, fue, fuimos, fuisteis, fueron.'),
  ('kurssi_3',  6, 'grammar', 'Preteriti epäsäännölliset — tener, estar, hacer',  8, 'Vihje: kanta muuttuu, päätteet ovat samat — tuv-, estuv-, hic-/hiz-. Esim. "Hice un viaje" = tein matkan.'),
  ('kurssi_3',  7, 'vocab',   'Matkailu ja nähtävyydet',                         10, 'Visitar, museo, plaza, monumento. 10 sanaa.'),
  ('kurssi_3',  8, 'mixed',   'Preteriti + matkailusanasto',                      8, 'Yhdistä: kerro mitä teit matkalla.'),
  ('kurssi_3',  9, 'reading', 'Matkablogi — luetun ymmärtäminen',                 5, 'Lue matkablogi ja vastaa 5 kysymykseen.'),
  ('kurssi_3', 10, 'writing', 'Kertomus lomamatkasta (100–150 sanaa)',            1, 'Preteriti pakollinen. Kerro mitä teit, missä olit ja mitä näit.'),
  ('kurssi_3', 11, 'test',    'Kertaustesti — Kurssi 3',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 3: preteriti + matkailusanasto. 15 kysymystä.');

-- KURSSI 4 — "Ennen ja nyt" (12 oppituntia, B-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_4',  1, 'vocab',   'Lapsuus ja muistot',                              10, 'Niñez, recuerdo, jugar, abuelo. Sanoja jotka herättävät muistoja — käytät niitä imperfektissä.'),
  ('kurssi_4',  2, 'grammar', 'Imperfekti — säännölliset -ar-verbit',             8, 'Imperfekti = toistuva tai taustalla oleva mennyt teko. Hablar → hablaba, hablabas, hablaba, hablábamos, hablabais, hablaban. "Cuando era pequeño hablaba español".'),
  ('kurssi_4',  3, 'grammar', 'Imperfekti — -er-/-ir-verbit + epäsäännölliset (ser/ir/ver)', 8, 'Comer → comía. Vain 3 epäsäännöllistä: ser → era, ir → iba, ver → veía.'),
  ('kurssi_4',  4, 'vocab',   'Eläimet ja luonto',                               10, 'Perro, gato, árbol, río. 10 luontosanaa.'),
  ('kurssi_4',  5, 'grammar', 'Preteriti vs imperfekti — perusero',               8, 'Sääntö: preteriti = yksittäinen, päättynyt. Imperfekti = jatkuva, toistuva, kuvaileva. Esim. "Llovía" (satoi taustalla) vs "Llovió" (satoi ja loppui).'),
  ('kurssi_4',  6, 'grammar', 'Preteriti vs imperfekti — keskeytys (estaba + cuando)', 8, 'Vihje: kun yksi tapahtuma keskeyttää toisen, käytä imperfektiä taustalle ja preteritiä keskeytykselle.'),
  ('kurssi_4',  7, 'grammar', 'Preteriti vs imperfekti — toistuvuus vs kertaluontoisuus', 8, 'Vihje: "siempre, todos los días" → imperfekti. "Una vez, ayer, de repente" → preteriti.'),
  ('kurssi_4',  8, 'vocab',   'Adjektiivit ja kuvailut',                         10, 'Tranquilo, ruidoso, cálido, oscuro. Sanasto kuvauksiin imperfektissä.'),
  ('kurssi_4',  9, 'mixed',   'Lapsuuden tarina — preteriti + imperfekti',        8, 'Yhdistä molemmat aikamuodot luontevasti.'),
  ('kurssi_4', 10, 'reading', 'Nostalgia-aiheinen teksti — luetun ymmärtäminen',  5, 'Lue teksti lapsuuden muistoista ja vastaa 5 kysymykseen.'),
  ('kurssi_4', 11, 'writing', 'Lapsuuden kuvaus (120–160 sanaa)',                 1, 'Käytä molempia aikamuotoja: kuvaile (imperfekti) + kerro tapahtumia (preteriti).'),
  ('kurssi_4', 12, 'test',    'Kertaustesti — Kurssi 4',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 4: imperfekti + preteriti vs imperfekti. 15 kysymystä.');

-- KURSSI 5 — "Tulevaisuus ja unelmat" (11 oppituntia, C-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_5',  1, 'vocab',   'Työ ja ammatit',                                  10, 'Trabajar, sueldo, jefe, empresa. 10 sanaa työelämästä — YO-koe rakastaa työ-aiheita.'),
  ('kurssi_5',  2, 'grammar', 'Futuuri — säännölliset',                           8, 'Futuuri muodostetaan infinitiivistä + päätteet -é, -ás, -á, -emos, -éis, -án. Esim. hablaré, comerás, viviremos. "Mañana hablaré con ella".'),
  ('kurssi_5',  3, 'grammar', 'Futuuri — epäsäännölliset (tendré, pondré, haré, diré)', 8, 'Vihje: 12 yleisintä epäsäännöllistä on muistettava. Kanta muuttuu, päätteet samat: tener → tendr-, hacer → har-.'),
  ('kurssi_5',  4, 'vocab',   'Teknologia ja internet',                          10, 'Aplicación, contraseña, red social, descargar. Modernia sanastoa.'),
  ('kurssi_5',  5, 'grammar', 'Futuro próximo (ir a + infinitiivi)',              8, 'Vihje: arkikielessä yleisempi kuin "varsinainen" futuuri. "Voy a estudiar" = aion opiskella.'),
  ('kurssi_5',  6, 'grammar', 'Konditionaali — säännölliset',                     8, 'Konditionaali = -isi-muoto. Infinitiivi + päätteet -ía, -ías, -ía, -íamos, -íais, -ían. "Me gustaría viajar" = haluaisin matkustaa.'),
  ('kurssi_5',  7, 'grammar', 'Konditionaali — epäsäännölliset',                  8, 'Vihje: samat kannat kuin futuurissa. tener → tendría, hacer → haría, decir → diría.'),
  ('kurssi_5',  8, 'mixed',   'Tulevaisuuden kuvaus — futuuri + konditionaali',   8, 'Yhdistä: mitä aiot tehdä + mitä haluaisit tehdä.'),
  ('kurssi_5',  9, 'reading', 'Artikkeli tulevaisuudesta',                        5, 'Lue C-tason artikkeli ja vastaa 5 kysymykseen.'),
  ('kurssi_5', 10, 'writing', 'Kirje tulevaisuudesta (140–180 sanaa)',            1, 'Käytä futuuri + konditionaali. Kuvaa unelmasi 10 vuoden päähän.'),
  ('kurssi_5', 11, 'test',    'Kertaustesti — Kurssi 5',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 5: futuuri + konditionaali. 15 kysymystä.');

-- KURSSI 6 — "Maailman ongelmat" (12 oppituntia, C-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_6',  1, 'vocab',   'Ympäristö ja luonto',                             10, 'Medio ambiente, contaminación, reciclar, calentamiento. 10 ympäristö-sanaa — YO-kokeen klassinen aihe.'),
  ('kurssi_6',  2, 'grammar', 'Subjunktiivin muodostus — säännölliset',           8, 'Subjunktiivi = "miten asia voisi olla". Säännölliset: -ar-verbi → e-päätteet (hable), -er/-ir → a-päätteet (coma, viva). Käytetään aina laukaisijasanan jälkeen.'),
  ('kurssi_6',  3, 'grammar', 'Subjunktiivin muodostus — epäsäännölliset',        8, 'Vihje: subjunktiivin epäsäännölliset perustuvat preesensin yo-muotoon. "Tengo" → "tenga", "hago" → "haga".'),
  ('kurssi_6',  4, 'vocab',   'Yhteiskunta ja politiikka',                       10, 'Gobierno, votar, derecho, libertad. 10 yhteiskuntasanaa.'),
  ('kurssi_6',  5, 'grammar', 'Ojalá + subjunktiivi',                             8, 'Vihje: ojalá vaatii AINA subjunktiivin. "Ojalá llueva mañana" = kunpa huomenna sataisi.'),
  ('kurssi_6',  6, 'grammar', 'Es importante / necesario / bueno que + subj.',    8, 'Vihje: "es + adjektiivi + que" → subjunktiivi. "Es importante que estudies".'),
  ('kurssi_6',  7, 'grammar', 'Quiero / espero / prefiero que + subjunktiivi',    8, 'Vihje: kun haluat jonkun MUUN tekevän jotain, käytä subjunktiivia. "Quiero que vengas" = haluan että tulet.'),
  ('kurssi_6',  8, 'vocab',   'Ilmastonmuutos ja ympäristöongelmat',             10, 'Sequía, basura, especies en peligro. Tarkempaa ympäristösanastoa.'),
  ('kurssi_6',  9, 'mixed',   'Mielipide subjunktiivin kanssa',                   8, 'Yhdistä: kerro mielipiteesi yhteiskunnallisesta aiheesta käyttäen subjunktiivia.'),
  ('kurssi_6', 10, 'reading', 'Ympäristöartikkeli',                               5, 'Lue C-tason artikkeli ympäristöstä ja vastaa 5 kysymykseen.'),
  ('kurssi_6', 11, 'writing', 'Mielipidekirjoitus (160–200 sanaa)',               1, 'Subjunktiivi pakollinen. Argumentoi yhteiskunnallisesta aiheesta.'),
  ('kurssi_6', 12, 'test',    'Kertaustesti — Kurssi 6',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 6: subjunktiivin preesens + yhteiskuntasanasto. 15 kysymystä.');

-- KURSSI 7 — "Kulttuuri ja yhteiskunta" (12 oppituntia, M-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_7',  1, 'vocab',   'Kulttuuri ja taide',                              10, 'Pintura, escritor, exposición, herencia. 10 kulttuurisanaa M-tasolla.'),
  ('kurssi_7',  2, 'grammar', 'Subjunktiivi aika-konjunktioiden kanssa (cuando, antes de que)', 8, 'Vihje: tulevaan viittaava "cuando" vaatii subjunktiivin. "Cuando tenga tiempo, te llamaré".'),
  ('kurssi_7',  3, 'grammar', 'Subjunktiivi tarkoitus-konjunktioiden kanssa (para que, a fin de que)', 8, 'Vihje: "para que" = jotta — vaatii AINA subjunktiivin. "Te lo digo para que lo sepas".'),
  ('kurssi_7',  4, 'vocab',   'Historia ja politiikka',                          10, 'Guerra, dictadura, democracia, monarquía. 10 historia-sanaa.'),
  ('kurssi_7',  5, 'grammar', 'Subjunktiivi kielto-rakenteissa (no creer, dudar)', 8, 'Vihje: kielto/epäilys → subjunktiivi. "No creo que sea verdad". Mutta: "Creo que es verdad" → indikatiivi.'),
  ('kurssi_7',  6, 'grammar', 'Pluskvamperfekti — muodostus',                     8, 'Pluskvamperfekti = "olin tehnyt". Haber imperfektissä + partisiippi: había hablado, habías comido, había vivido. Lyhyt, ulkoa.'),
  ('kurssi_7',  7, 'grammar', 'Pluskvamperfekti — käyttö (ennen toista menneisyyttä)', 8, 'Vihje: kun yksi mennyt teko tapahtuu ENNEN toista mennyttä. "Cuando llegué, ya habían comido" = kun saavuin, he olivat jo syöneet.'),
  ('kurssi_7',  8, 'vocab',   'Media ja kommunikaatio',                          10, 'Periódico, noticia, anuncio, censura. M-tasoisia mediasanoja.'),
  ('kurssi_7',  9, 'mixed',   'Kulttuuri + subjunktiivi + pluskvamperfekti',      8, 'Yhdistä: kerro kulttuuriaiheesta käyttäen molempia rakenteita.'),
  ('kurssi_7', 10, 'reading', 'Kulttuuriaiheinen teksti — luetun ymmärtäminen',   5, 'Lue M-tason teksti ja vastaa 5 kysymykseen.'),
  ('kurssi_7', 11, 'writing', 'Argumentoiva teksti (180–220 sanaa)',              1, 'Käytä subjunktiivi + pluskvamperfekti. Argumentoi monimutkaisesta aiheesta.'),
  ('kurssi_7', 12, 'test',    'Kertaustesti — Kurssi 7',                         15, 'Nyt testataan mitä olet oppinut — Kurssi 7: subjunktiivi syvemmin + pluskvamperfekti. 15 kysymystä.');

-- KURSSI 8 — "YO-koevalmiiksi" (12 oppituntia, E/L-taso)
INSERT INTO curriculum_lessons (kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet) VALUES
  ('kurssi_8',  1, 'grammar', 'Subjunktiivi imperfekti — muodostus',              8, 'Imperfektin subjunktiivi = preteritin ellos-muoto miinus -ron + päätteet -ra/-se. Esim. tuvieron → tuviera, hicieron → hiciera. "Si tuviera tiempo..."'),
  ('kurssi_8',  2, 'grammar', 'Si-lauseet (si tuviera, haría)',                   8, 'Vihje: epätodellinen ehto = si + imperfektin subjunktiivi + konditionaali. "Si fuera rico, viajaría más".'),
  ('kurssi_8',  3, 'vocab',   'YO-koesanasto sekoitettuna — kaikki teemat',      15, 'Kaikki kuusi YO-pääteemaa sekoitettuna: ympäristö, työ, kulttuuri, yhteiskunta, terveys, matkailu.'),
  ('kurssi_8',  4, 'grammar', 'Aikamuotojen kertaus — sekalaiset lauseet',        8, 'Vihje: pää harjoittelua — preesens, preteriti, imperfekti, futuuri, konditionaali, subjunktiivi. Lue kontekstia.'),
  ('kurssi_8',  5, 'mixed',   'Pitkä aukkotehtävä (10+ aukkoa, kaikki rakenteet)', 10, 'YO-tyyppinen aukkotehtävä — yhdistää kaikki kurssin 1–7 rakenteet.'),
  ('kurssi_8',  6, 'reading', 'YO-tasoinen teksti — luetun ymmärtäminen',         5, 'Lue E-tason teksti (300+ sanaa) ja vastaa 5 kysymykseen.'),
  ('kurssi_8',  7, 'writing', 'Lyhyt YO-tehtävä (160–200 sanaa)',                 1, 'YO-tyyppinen lyhyt kirjoitus annetusta aiheesta.'),
  ('kurssi_8',  8, 'reading', 'Toinen YO-tasoinen teksti',                        5, 'Toinen E-tason teksti — eri aihe, sama vaikeus.'),
  ('kurssi_8',  9, 'grammar', 'Subjunktiivi imperfekti sidosteisuussanoilla',     8, 'Vihje: aunque, a pesar de que, como si — kaikki vaativat subjunktiivin tietyissä konteksteissa.'),
  ('kurssi_8', 10, 'writing', 'Pitkä YO-tehtävä (200–240 sanaa)',                 1, 'YO-tyyppinen pitkä kirjoitus — täysi YTL-rubriikki.'),
  ('kurssi_8', 11, 'test',    'Täyskoe-simulaatio — luettu + rakenteet + kirjoitus', 20, 'Nyt testataan mitä olet oppinut — Kurssi 8: täysi YO-simulaatio. 20 kysymystä + kirjoitus.'),
  ('kurssi_8', 12, 'test',    'Loppukertaus + henkilökohtainen palaute',         15, 'Nyt testataan mitä olet oppinut — koko polku. 15 kysymystä kaikista kursseista + tutorin loppupalaute.');
