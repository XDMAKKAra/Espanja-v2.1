/**
 * Curriculum source-of-truth in JS — mirrors supabase/migrations/20260429_curriculum.sql.
 *
 * Used by routes/curriculum.js as a fallback when the curriculum_kurssit /
 * curriculum_lessons tables aren't yet seeded in Supabase (e.g. the migration
 * hasn't been applied via dashboard SQL editor). The SQL file is canonical;
 * if the two diverge, treat the SQL as truth.
 */

export const CURRICULUM_KURSSIT = [
  { key: "kurssi_1", title: "Kurssi 1 — Kuka olen",                description: "Preesens säännölliset, ser/estar perusteet, persoona ja perhe.",                          level: "A", vocab_theme: "general vocabulary",     grammar_focus: ["present_regular"],                              lesson_count: 10, sort_order: 1 },
  { key: "kurssi_2", title: "Kurssi 2 — Arki ja elämä",            description: "Preesens epäsäännölliset, gustar-rakenne, koti ja ruoka.",                                level: "A", vocab_theme: "general vocabulary",     grammar_focus: ["present_irregular"],                            lesson_count: 10, sort_order: 2 },
  { key: "kurssi_3", title: "Kurssi 3 — Mitä tein",                description: "Preteriti säännölliset ja yleisimmät epäsäännölliset, matkustamisen sanasto.",            level: "B", vocab_theme: "travel and transport",   grammar_focus: ["preterite"],                                    lesson_count: 11, sort_order: 3 },
  { key: "kurssi_4", title: "Kurssi 4 — Ennen ja nyt",             description: "Imperfekti ja preteriti vs imperfekti — YO-klassikko, lapsuus ja muistot.",               level: "B", vocab_theme: "environment and nature", grammar_focus: ["imperfect", "preterite_vs_imperfect"],          lesson_count: 12, sort_order: 4 },
  { key: "kurssi_5", title: "Kurssi 5 — Tulevaisuus ja unelmat",   description: "Futuuri ja konditionaali, työ ja teknologia.",                                            level: "C", vocab_theme: "work and economy",       grammar_focus: ["future", "conditional"],                        lesson_count: 11, sort_order: 5 },
  { key: "kurssi_6", title: "Kurssi 6 — Maailman ongelmat",        description: "Subjunktiivin preesens (ojalá, es importante que), ympäristö ja yhteiskunta.",            level: "C", vocab_theme: "society and politics",   grammar_focus: ["subjunctive_present"],                          lesson_count: 12, sort_order: 6 },
  { key: "kurssi_7", title: "Kurssi 7 — Kulttuuri ja yhteiskunta", description: "Subjunktiivi syvemmin, pluskvamperfekti, kulttuuri ja media.",                            level: "M", vocab_theme: "culture and arts",       grammar_focus: ["subjunctive_present", "pluscuamperfecto"],      lesson_count: 12, sort_order: 7 },
  { key: "kurssi_8", title: "Kurssi 8 — YO-koevalmiiksi",          description: "Subjunktiivi imperfekti (si tuviera), kaikkien rakenteiden kertaus, YO-tyyppiset tehtävät.", level: "E", vocab_theme: "general vocabulary",     grammar_focus: ["subjunctive_imperfect"],                        lesson_count: 12, sort_order: 8 },
];

const LESSON_ROWS = [
  // K1 — Kuka olen
  ["kurssi_1",  1, "vocab",   "Perhe ja kansallisuudet — perussanasto", 10, 'Aloitamme nimillä joita käytät joka päivä. Esim. "madre" = äiti, "padre" = isä, "hermano" = veli. Tunnista oikea käännös 10 sanasta.'],
  ["kurssi_1",  2, "grammar", "-ar-verbit preesensissä — säännöllinen taivutus",  8, "Preesens kertoo mitä teet nyt. Esim. hablar → hablo, hablas, habla, hablamos, habláis, hablan. Yksi kirjain pään perään per persoona."],
  ["kurssi_1",  3, "grammar", "-er- ja -ir-verbit preesensissä",                  8, "Sama logiikka kuin -ar, mutta päätteet vaihtuvat: comer → como, comes, come. Vivir → vivo, vives, vive."],
  ["kurssi_1",  4, "vocab",   "Koulu ja värit",                                  10, 'Koulun arkea: "libro" = kirja, "profesor" = opettaja. Värit: rojo, azul, verde. Tunnista 10 sanaa.'],
  ["kurssi_1",  5, "mixed",   "Ser vs estar — perusteet",                         8, "Ser = pysyvä (Soy finlandés). Estar = ohimenevä tai paikka (Estoy cansado, Estoy en casa). Mieti aina: pysyvä vai hetkellinen?"],
  ["kurssi_1",  6, "vocab",   "Numerot ja ikä",                                  10, 'Numerot 1–100 ja ikä-rakenne: "Tengo 17 años". Tärkeä YO-kokeessa.'],
  ["kurssi_1",  7, "grammar", "Ser vs estar syvemmin",                            8, "Vihje: tunteet ja sijainti aina estar, ammatti ja kansallisuus aina ser."],
  ["kurssi_1",  8, "reading", "Lyhyt teksti perheestä — luetun ymmärtäminen",     5, "Lue lyhyt esittely perheestä ja vastaa 5 kysymykseen."],
  ["kurssi_1",  9, "writing", "Kirjoita itsestäsi (50–80 sanaa)",                 1, "Esittele itsesi: nimi, ikä, kotipaikka, perhe, harrastukset."],
  ["kurssi_1", 10, "test",    "Kertaustesti — Kurssi 1",                         15, "Nyt testataan mitä olet oppinut — Kurssi 1: preesens + ser/estar + perussanasto. 15 kysymystä."],

  // K2 — Arki ja elämä
  ["kurssi_2",  1, "vocab",   "Koti ja huonekalut",                              10, 'Tutustut kodin sanastoon: "cocina" = keittiö, "dormitorio" = makuuhuone, "mesa" = pöytä. 10 sanan tunnistus.'],
  ["kurssi_2",  2, "grammar", "Epäsäännölliset preesens-verbit (ser/estar/tener/ir/hacer)", 8, 'Ulkoa: tengo/tienes/tiene, voy/vas/va, hago/haces/hace. Esim. "Tengo hambre" = minulla on nälkä.'],
  ["kurssi_2",  3, "vocab",   "Ruoka ja ateriat",                                10, "Aamiainen, lounas, illallinen — desayuno, comida, cena. Ruoat: pan, arroz, fruta. 10 sanan tunnistus."],
  ["kurssi_2",  4, "grammar", "Gustar-rakenne ja indirekti pronominit",           8, 'Gustar toimii käänteisesti: "Me gusta el café" (kahvi miellyttää minua). Yksikkö "gusta", monikko "gustan".'],
  ["kurssi_2",  5, "vocab",   "Vapaa-aika ja harrastukset",                      10, "Hacer deporte, jugar al fútbol, leer, viajar. 10 harrastussanaa."],
  ["kurssi_2",  6, "grammar", "Stem-changers (poder, querer, dormir)",            8, "Vihje: o → ue (puedo, duermo), e → ie (quiero), e → i (pido). Vain nosotros/vosotros pysyy ennallaan."],
  ["kurssi_2",  7, "mixed",   "Arjen kuvaus — gustar + harrastussanasto",         8, "Yhdistä: kerro mistä pidät ja mitä teet vapaa-ajalla."],
  ["kurssi_2",  8, "reading", "Arki-aiheinen teksti — luetun ymmärtäminen",       5, "Lue teksti tavallisesta päivästä ja vastaa 5 kysymykseen."],
  ["kurssi_2",  9, "writing", "Sähköposti ystävälle (80–120 sanaa)",              1, "Käytä gustar-rakennetta ja arjen sanastoa."],
  ["kurssi_2", 10, "test",    "Kertaustesti — Kurssi 2",                         15, "Nyt testataan mitä olet oppinut — Kurssi 2: epäsäännölliset preesens + gustar + arjen sanasto. 15 kysymystä."],

  // K3 — Mitä tein
  ["kurssi_3",  1, "vocab",   "Matkustaminen ja kulkuvälineet",                  10, 'Matkasanasto käyttöön: "tren" = juna, "avión" = lentokone, "billete" = lippu. 10 sanaa joita YO-koe rakastaa.'],
  ["kurssi_3",  2, "grammar", "Preteriti — säännölliset -ar-verbit",              8, 'Preteriti = mennyt yksittäinen teko. Hablar → hablé, hablaste, habló, hablamos, hablasteis, hablaron. "Ayer hablé con mi amigo".'],
  ["kurssi_3",  3, "grammar", "Preteriti — -er- ja -ir-verbit",                   8, "Comer → comí, comiste, comió. Vivir → viví, viviste, vivió. -er ja -ir käyttävät samat päätteet."],
  ["kurssi_3",  4, "vocab",   "Hotelli ja majoitus",                             10, "Reservar, habitación, llave, ducha. Tärkeä matkakirjoituksissa."],
  ["kurssi_3",  5, "grammar", "Preteriti epäsäännölliset — ser ja ir",            8, "Vihje: ser ja ir taipuvat samoin preteritissä → fui, fuiste, fue, fuimos, fuisteis, fueron."],
  ["kurssi_3",  6, "grammar", "Preteriti epäsäännölliset — tener, estar, hacer",  8, 'Vihje: kanta muuttuu, päätteet ovat samat — tuv-, estuv-, hic-/hiz-. Esim. "Hice un viaje" = tein matkan.'],
  ["kurssi_3",  7, "vocab",   "Matkailu ja nähtävyydet",                         10, "Visitar, museo, plaza, monumento. 10 sanaa."],
  ["kurssi_3",  8, "mixed",   "Preteriti + matkailusanasto",                      8, "Yhdistä: kerro mitä teit matkalla."],
  ["kurssi_3",  9, "reading", "Matkablogi — luetun ymmärtäminen",                 5, "Lue matkablogi ja vastaa 5 kysymykseen."],
  ["kurssi_3", 10, "writing", "Kertomus lomamatkasta (100–150 sanaa)",            1, "Preteriti pakollinen. Kerro mitä teit, missä olit ja mitä näit."],
  ["kurssi_3", 11, "test",    "Kertaustesti — Kurssi 3",                         15, "Nyt testataan mitä olet oppinut — Kurssi 3: preteriti + matkailusanasto. 15 kysymystä."],

  // K4 — Ennen ja nyt
  ["kurssi_4",  1, "vocab",   "Lapsuus ja muistot",                              10, "Niñez, recuerdo, jugar, abuelo. Sanoja jotka herättävät muistoja — käytät niitä imperfektissä."],
  ["kurssi_4",  2, "grammar", "Imperfekti — säännölliset -ar-verbit",             8, 'Imperfekti = toistuva tai taustalla oleva mennyt teko. Hablar → hablaba, hablabas, hablaba. "Cuando era pequeño hablaba español".'],
  ["kurssi_4",  3, "grammar", "Imperfekti — -er-/-ir-verbit + epäsäännölliset (ser/ir/ver)", 8, "Comer → comía. Vain 3 epäsäännöllistä: ser → era, ir → iba, ver → veía."],
  ["kurssi_4",  4, "vocab",   "Eläimet ja luonto",                               10, "Perro, gato, árbol, río. 10 luontosanaa."],
  ["kurssi_4",  5, "grammar", "Preteriti vs imperfekti — perusero",               8, 'Sääntö: preteriti = yksittäinen, päättynyt. Imperfekti = jatkuva, toistuva, kuvaileva. "Llovía" (satoi taustalla) vs "Llovió" (satoi ja loppui).'],
  ["kurssi_4",  6, "grammar", "Preteriti vs imperfekti — keskeytys (estaba + cuando)", 8, "Vihje: kun yksi tapahtuma keskeyttää toisen, käytä imperfektiä taustalle ja preteritiä keskeytykselle."],
  ["kurssi_4",  7, "grammar", "Preteriti vs imperfekti — toistuvuus vs kertaluontoisuus", 8, 'Vihje: "siempre, todos los días" → imperfekti. "Una vez, ayer, de repente" → preteriti.'],
  ["kurssi_4",  8, "vocab",   "Adjektiivit ja kuvailut",                         10, "Tranquilo, ruidoso, cálido, oscuro. Sanasto kuvauksiin imperfektissä."],
  ["kurssi_4",  9, "mixed",   "Lapsuuden tarina — preteriti + imperfekti",        8, "Yhdistä molemmat aikamuodot luontevasti."],
  ["kurssi_4", 10, "reading", "Nostalgia-aiheinen teksti — luetun ymmärtäminen",  5, "Lue teksti lapsuuden muistoista ja vastaa 5 kysymykseen."],
  ["kurssi_4", 11, "writing", "Lapsuuden kuvaus (120–160 sanaa)",                 1, "Käytä molempia aikamuotoja: kuvaile (imperfekti) + kerro tapahtumia (preteriti)."],
  ["kurssi_4", 12, "test",    "Kertaustesti — Kurssi 4",                         15, "Nyt testataan mitä olet oppinut — Kurssi 4: imperfekti + preteriti vs imperfekti. 15 kysymystä."],

  // K5 — Tulevaisuus ja unelmat
  ["kurssi_5",  1, "vocab",   "Työ ja ammatit",                                  10, "Trabajar, sueldo, jefe, empresa. 10 sanaa työelämästä — YO-koe rakastaa työ-aiheita."],
  ["kurssi_5",  2, "grammar", "Futuuri — säännölliset",                           8, 'Futuuri muodostetaan infinitiivistä + päätteet -é, -ás, -á, -emos, -éis, -án. "Mañana hablaré con ella".'],
  ["kurssi_5",  3, "grammar", "Futuuri — epäsäännölliset (tendré, pondré, haré, diré)", 8, "Vihje: 12 yleisintä epäsäännöllistä on muistettava. Kanta muuttuu, päätteet samat: tener → tendr-, hacer → har-."],
  ["kurssi_5",  4, "vocab",   "Teknologia ja internet",                          10, "Aplicación, contraseña, red social, descargar. Modernia sanastoa."],
  ["kurssi_5",  5, "grammar", "Futuro próximo (ir a + infinitiivi)",              8, 'Vihje: arkikielessä yleisempi kuin "varsinainen" futuuri. "Voy a estudiar" = aion opiskella.'],
  ["kurssi_5",  6, "grammar", "Konditionaali — säännölliset",                     8, 'Konditionaali = -isi-muoto. Infinitiivi + päätteet -ía. "Me gustaría viajar" = haluaisin matkustaa.'],
  ["kurssi_5",  7, "grammar", "Konditionaali — epäsäännölliset",                  8, "Vihje: samat kannat kuin futuurissa. tener → tendría, hacer → haría, decir → diría."],
  ["kurssi_5",  8, "mixed",   "Tulevaisuuden kuvaus — futuuri + konditionaali",   8, "Yhdistä: mitä aiot tehdä + mitä haluaisit tehdä."],
  ["kurssi_5",  9, "reading", "Artikkeli tulevaisuudesta",                        5, "Lue C-tason artikkeli ja vastaa 5 kysymykseen."],
  ["kurssi_5", 10, "writing", "Kirje tulevaisuudesta (140–180 sanaa)",            1, "Käytä futuuri + konditionaali. Kuvaa unelmasi 10 vuoden päähän."],
  ["kurssi_5", 11, "test",    "Kertaustesti — Kurssi 5",                         15, "Nyt testataan mitä olet oppinut — Kurssi 5: futuuri + konditionaali. 15 kysymystä."],

  // K6 — Maailman ongelmat
  ["kurssi_6",  1, "vocab",   "Ympäristö ja luonto",                             10, "Medio ambiente, contaminación, reciclar, calentamiento. 10 ympäristö-sanaa — YO-kokeen klassinen aihe."],
  ["kurssi_6",  2, "grammar", "Subjunktiivin muodostus — säännölliset",           8, 'Subjunktiivi = "miten asia voisi olla". Säännölliset: -ar-verbi → e-päätteet (hable), -er/-ir → a-päätteet (coma, viva). Käytetään aina laukaisijasanan jälkeen.'],
  ["kurssi_6",  3, "grammar", "Subjunktiivin muodostus — epäsäännölliset",        8, 'Vihje: subjunktiivin epäsäännölliset perustuvat preesensin yo-muotoon. "Tengo" → "tenga", "hago" → "haga".'],
  ["kurssi_6",  4, "vocab",   "Yhteiskunta ja politiikka",                       10, "Gobierno, votar, derecho, libertad. 10 yhteiskuntasanaa."],
  ["kurssi_6",  5, "grammar", "Ojalá + subjunktiivi",                             8, 'Vihje: ojalá vaatii AINA subjunktiivin. "Ojalá llueva mañana" = kunpa huomenna sataisi.'],
  ["kurssi_6",  6, "grammar", "Es importante / necesario / bueno que + subj.",    8, 'Vihje: "es + adjektiivi + que" → subjunktiivi. "Es importante que estudies".'],
  ["kurssi_6",  7, "grammar", "Quiero / espero / prefiero que + subjunktiivi",    8, 'Vihje: kun haluat jonkun MUUN tekevän jotain, käytä subjunktiivia. "Quiero que vengas" = haluan että tulet.'],
  ["kurssi_6",  8, "vocab",   "Ilmastonmuutos ja ympäristöongelmat",             10, "Sequía, basura, especies en peligro. Tarkempaa ympäristösanastoa."],
  ["kurssi_6",  9, "mixed",   "Mielipide subjunktiivin kanssa",                   8, "Yhdistä: kerro mielipiteesi yhteiskunnallisesta aiheesta käyttäen subjunktiivia."],
  ["kurssi_6", 10, "reading", "Ympäristöartikkeli",                               5, "Lue C-tason artikkeli ympäristöstä ja vastaa 5 kysymykseen."],
  ["kurssi_6", 11, "writing", "Mielipidekirjoitus (160–200 sanaa)",               1, "Subjunktiivi pakollinen. Argumentoi yhteiskunnallisesta aiheesta."],
  ["kurssi_6", 12, "test",    "Kertaustesti — Kurssi 6",                         15, "Nyt testataan mitä olet oppinut — Kurssi 6: subjunktiivin preesens + yhteiskuntasanasto. 15 kysymystä."],

  // K7 — Kulttuuri ja yhteiskunta
  ["kurssi_7",  1, "vocab",   "Kulttuuri ja taide",                              10, "Pintura, escritor, exposición, herencia. 10 kulttuurisanaa M-tasolla."],
  ["kurssi_7",  2, "grammar", "Subjunktiivi aika-konjunktioiden kanssa (cuando, antes de que)", 8, 'Vihje: tulevaan viittaava "cuando" vaatii subjunktiivin. "Cuando tenga tiempo, te llamaré".'],
  ["kurssi_7",  3, "grammar", "Subjunktiivi tarkoitus-konjunktioiden kanssa (para que, a fin de que)", 8, 'Vihje: "para que" = jotta — vaatii AINA subjunktiivin. "Te lo digo para que lo sepas".'],
  ["kurssi_7",  4, "vocab",   "Historia ja politiikka",                          10, "Guerra, dictadura, democracia, monarquía. 10 historia-sanaa."],
  ["kurssi_7",  5, "grammar", "Subjunktiivi kielto-rakenteissa (no creer, dudar)", 8, 'Vihje: kielto/epäilys → subjunktiivi. "No creo que sea verdad". Mutta: "Creo que es verdad" → indikatiivi.'],
  ["kurssi_7",  6, "grammar", "Pluskvamperfekti — muodostus",                     8, 'Pluskvamperfekti = "olin tehnyt". Haber imperfektissä + partisiippi: había hablado, habías comido, había vivido.'],
  ["kurssi_7",  7, "grammar", "Pluskvamperfekti — käyttö (ennen toista menneisyyttä)", 8, 'Vihje: kun yksi mennyt teko tapahtuu ENNEN toista mennyttä. "Cuando llegué, ya habían comido".'],
  ["kurssi_7",  8, "vocab",   "Media ja kommunikaatio",                          10, "Periódico, noticia, anuncio, censura. M-tasoisia mediasanoja."],
  ["kurssi_7",  9, "mixed",   "Kulttuuri + subjunktiivi + pluskvamperfekti",      8, "Yhdistä: kerro kulttuuriaiheesta käyttäen molempia rakenteita."],
  ["kurssi_7", 10, "reading", "Kulttuuriaiheinen teksti — luetun ymmärtäminen",   5, "Lue M-tason teksti ja vastaa 5 kysymykseen."],
  ["kurssi_7", 11, "writing", "Argumentoiva teksti (180–220 sanaa)",              1, "Käytä subjunktiivi + pluskvamperfekti. Argumentoi monimutkaisesta aiheesta."],
  ["kurssi_7", 12, "test",    "Kertaustesti — Kurssi 7",                         15, "Nyt testataan mitä olet oppinut — Kurssi 7: subjunktiivi syvemmin + pluskvamperfekti. 15 kysymystä."],

  // K8 — YO-koevalmiiksi
  ["kurssi_8",  1, "grammar", "Subjunktiivi imperfekti — muodostus",              8, 'Imperfektin subjunktiivi = preteritin ellos-muoto miinus -ron + päätteet -ra/-se. Esim. tuvieron → tuviera. "Si tuviera tiempo..."'],
  ["kurssi_8",  2, "grammar", "Si-lauseet (si tuviera, haría)",                   8, 'Vihje: epätodellinen ehto = si + imperfektin subjunktiivi + konditionaali. "Si fuera rico, viajaría más".'],
  ["kurssi_8",  3, "vocab",   "YO-koesanasto sekoitettuna — kaikki teemat",      15, "Kaikki kuusi YO-pääteemaa sekoitettuna: ympäristö, työ, kulttuuri, yhteiskunta, terveys, matkailu."],
  ["kurssi_8",  4, "grammar", "Aikamuotojen kertaus — sekalaiset lauseet",        8, "Vihje: pää harjoittelua — preesens, preteriti, imperfekti, futuuri, konditionaali, subjunktiivi. Lue kontekstia."],
  ["kurssi_8",  5, "mixed",   "Pitkä aukkotehtävä (10+ aukkoa, kaikki rakenteet)", 10, "YO-tyyppinen aukkotehtävä — yhdistää kaikki kurssin 1–7 rakenteet."],
  ["kurssi_8",  6, "reading", "YO-tasoinen teksti — luetun ymmärtäminen",         5, "Lue E-tason teksti (300+ sanaa) ja vastaa 5 kysymykseen."],
  ["kurssi_8",  7, "writing", "Lyhyt YO-tehtävä (160–200 sanaa)",                 1, "YO-tyyppinen lyhyt kirjoitus annetusta aiheesta."],
  ["kurssi_8",  8, "reading", "Toinen YO-tasoinen teksti",                        5, "Toinen E-tason teksti — eri aihe, sama vaikeus."],
  ["kurssi_8",  9, "grammar", "Subjunktiivi imperfekti sidosteisuussanoilla",     8, "Vihje: aunque, a pesar de que, como si — kaikki vaativat subjunktiivin tietyissä konteksteissa."],
  ["kurssi_8", 10, "writing", "Pitkä YO-tehtävä (200–240 sanaa)",                 1, "YO-tyyppinen pitkä kirjoitus — täysi YTL-rubriikki."],
  ["kurssi_8", 11, "test",    "Täyskoe-simulaatio — luettu + rakenteet + kirjoitus", 20, "Nyt testataan mitä olet oppinut — Kurssi 8: täysi YO-simulaatio. 20 kysymystä + kirjoitus."],
  ["kurssi_8", 12, "test",    "Loppukertaus + henkilökohtainen palaute",         15, "Nyt testataan mitä olet oppinut — koko polku. 15 kysymystä kaikista kursseista + tutorin loppupalaute."],
];

export const CURRICULUM_LESSONS = LESSON_ROWS.map(([kurssiKey, sortOrder, type, focus, exerciseCount, snippet], i) => ({
  id: i + 1,
  kurssi_key: kurssiKey,
  sort_order: sortOrder,
  type,
  focus,
  exercise_count: exerciseCount,
  teaching_snippet: snippet,
}));

export function lessonsForKurssi(kurssiKey) {
  return CURRICULUM_LESSONS
    .filter((l) => l.kurssi_key === kurssiKey)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function findKurssi(kurssiKey) {
  return CURRICULUM_KURSSIT.find((k) => k.key === kurssiKey) || null;
}
