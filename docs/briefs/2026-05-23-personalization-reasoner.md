# BRIEF: Personalization reasoner — taso-arvio + suunnitelma + painotettu polku (L-V294-PERSONALIZATION-REASONER-1)

**Päivä:** 2026-05-23
**Loop:** L-V294-PERSONALIZATION-REASONER-1
**Prioriteetti:** P0 (L-V292 + L-V293 mainissa ensin)
**Koko:** keskisuuri-iso (1–2 committia: reasoner-logiikka + exercise-painotus)
**Skill-stack:** `practice-problem-sequence-designer`, `variation-theory-task-designer`, `retrieval-practice-generator`, `scaffolded-task-modifier`, `worked-example-fading-designer`, `cognitive-load-analyser`, `criterion-referenced-rubric-generator`, `adaptive-hint-sequence-designer`, `supabase`, `supabase-postgres-best-practices`

---

## Tausta ja päätös

Kun käyttäjä on tehnyt onboarding-diagnostiikan (L-V293), tarvitsemme **backend-logiikan joka tuottaa:**
1. Skill-profilen (taso-arvio per kielioppi-aihe + per taito: oral / reading / writing / orthography)
2. Vahvuudet & puutteet
3. Räätälöidyn 3 viikon suunnitelman
4. Painotetut exercise-pool:t (heikkoja aiheita 3x, vahvoja 0.3x)

Käyttäjän direktiivi (2026-05-23): *"Marcel puhuu kotona ja kävi vaikka K3+K4+K6+K7. AI päättelee: sujuva puhuja, mutta oikeinkirjoitus heikko + subjunktiivi puuttuu. Hänelle tulee taitotason arvio, parannusehdotuksia, suunnitelma ja kurssi räätälöidään."*

## Mitä rakennetaan

### 1. Reasoner-moduuli `lib/personalization.js`

```js
import { LANG_CURRICULA } from './curriculumData.js';
import { inferGrammarExposure, computeCourseWeights } from './lukioMapping.js';

/**
 * Pää-entry. Ottaa onboarding-datan, palauttaa skill-profilen + suunnitelman.
 *
 * @param {Object} input
 * @param {string} input.lang - 'es' | 'de' | 'fr'
 * @param {Object|null} input.miniYO - { partA: {...}, partB: {...}, partC: {...} } tai null jos skipattu
 * @param {number[]} input.coursesCompleted
 * @param {Object} input.courseGrades - { 3: 8, 4: 9, 6: 7, 7: 8 }
 * @param {Object} input.biography - { homeUsage: 'yes'|'no'|'a_little', livedAbroad: ..., frequency: ... }
 * @param {string|null} input.textbookKey - 'mi_mundo' | null
 *
 * @returns {Object} {
 *   skillProfile: { [topic]: { level: 0-5, confidence: 0-1, source: 'diagnostic'|'inferred' } },
 *   strengths: string[],  // human-readable
 *   gaps: string[],       // human-readable
 *   plan: { week1: string[], week2: string[], week3: string[] },
 *   courseWeights: { 'kurssi_1': 0.5, 'kurssi_6': 3.0, ... },
 *   transparencyReasons: { [topicKey]: string }  // "Painotetaan koska et tunnistanut subjunktiivia testissä"
 * }
 */
export async function buildSkillProfile(input) {
  // Step 1: rakenna alustava skill-profile kurssi-historiasta + oppikirjasta
  const exposedTopics = inferGrammarExposure(
    input.lang,
    input.textbookKey || 'default',
    input.coursesCompleted
  );

  // Per aihe, alustava taso: arvosana 8+ → taso 4, 6-7 → taso 3, alle → taso 2
  const profile = {};
  exposedTopics.forEach(topic => {
    profile[topic] = inferLevelFromGrade(topic, input.courseGrades, input.coursesCompleted);
  });

  // Step 2: päivitä diagnostisen testin tuloksilla (vahvistaa tai kumoaa)
  if (input.miniYO) {
    applyDiagnosticResults(profile, input.miniYO);
  }

  // Step 3: päivitä biografisilla inferensseillä
  applyBiographicalInferences(profile, input.biography);
  //   - homeUsage=yes → oral_comprehension +1, orthography -1 (heritage pattern)
  //   - livedAbroad='over_year' → kaikki taidot +1
  //   - frequency='daily' → maintenance edge, ei plus mutta ei -

  // Step 4: identifioi puutteet (taso < 3 = puute)
  const gaps = identifyGaps(profile, input.lang);

  // Step 5: identifioi vahvuudet (taso >= 4)
  const strengths = identifyStrengths(profile);

  // Step 6: rakenna 3 viikon suunnitelma — LLM tähän
  const plan = await buildPlan({
    lang: input.lang,
    profile,
    gaps,
    strengths,
    grades: input.courseGrades,
  });

  // Step 7: laske exercise-pool-painot
  const courseWeights = computeCourseWeights(input.lang, gaps);

  // Step 8: rakenna transparency-reasons (UI:lle näkyväksi)
  const transparencyReasons = buildTransparencyReasons(profile, gaps, input);

  return { skillProfile: profile, strengths, gaps, plan, courseWeights, transparencyReasons };
}
```

### 2. Helper-funktiot

```js
/**
 * Per aihe, päättele alustava taso lukio-arvosanasta + onko aihe ylipäätään käsitelty
 */
function inferLevelFromGrade(topic, grades, coursesCompleted) {
  // mappaa topic -> mikä lukio-kurssi opetti sen (per oppikirja-mappingin oletusta)
  const courseTeachingTopic = findCourseTeachingTopic(topic);
  if (!coursesCompleted.includes(courseTeachingTopic)) {
    return { level: 0, confidence: 0.8, source: 'not_taught' };
  }
  const grade = grades[courseTeachingTopic];
  if (grade == null || grade === 'en_muista') {
    return { level: 2, confidence: 0.3, source: 'unknown_grade' };
  }
  // Map 4-10 → 0-5
  const level = Math.max(0, Math.min(5, Math.round((grade - 4) * 0.83)));
  return { level, confidence: 0.5, source: 'grade_inferred' };
}

/**
 * Diagnostinen testi vahvistaa tai kumoaa hypoteesit
 */
function applyDiagnosticResults(profile, miniYO) {
  // Part A (rakenne + sanasto) -- mc-tehtävät kertovat tunnistus-tason per aihe
  Object.entries(miniYO.partA.scoresByTopic).forEach(([topic, score]) => {
    const observedLevel = Math.round(score * 5); // 0-1 score → 0-5 level
    if (profile[topic]) {
      // Suostuvat: aseta painotettu keskiarvo
      const oldLevel = profile[topic].level;
      profile[topic].level = Math.round(oldLevel * 0.3 + observedLevel * 0.7);
      profile[topic].confidence = 0.85; // diagnostiikka antaa korkea-konffin
      profile[topic].source = 'diagnostic';
    } else {
      // Uusi aihe joka tuli esiin testissä
      profile[topic] = { level: observedLevel, confidence: 0.85, source: 'diagnostic' };
    }
  });

  // Part B (luetun ymmärtäminen) -- vaikuttaa: passive_vocab, reading_speed
  profile.passive_vocab = { level: miniYO.partB.score * 5, confidence: 0.7, source: 'diagnostic' };

  // Part C (kirjoitelma) -- AI-arvio antoi pisteet per dimensio
  if (miniYO.partC) {
    profile.orthography = { level: miniYO.partC.orthography_score * 5, confidence: 0.85, source: 'diagnostic' };
    profile.active_grammar = { level: miniYO.partC.grammar_score * 5, confidence: 0.85, source: 'diagnostic' };
    profile.active_vocab = { level: miniYO.partC.vocab_score * 5, confidence: 0.85, source: 'diagnostic' };
    // Jos kirjoitelma käytti tiettyjä rakenteita oikein → niiden tason confidence ylös
    miniYO.partC.used_grammar_topics.forEach(t => {
      if (profile[t]) profile[t].confidence = Math.min(1, profile[t].confidence + 0.15);
    });
  }
}

/**
 * Heritage speaker -patternit + asunut-maassa-boost
 */
function applyBiographicalInferences(profile, bio) {
  if (bio.homeUsage === 'yes') {
    // Heritage speaker: vahva puheen ymmärtäminen, todennäköisesti heikompi oikeinkirjoitus
    if (!profile.oral_comprehension) profile.oral_comprehension = { level: 4, confidence: 0.6, source: 'biographical' };
    else profile.oral_comprehension.level = Math.min(5, profile.oral_comprehension.level + 1);

    // Vain alenna oikeinkirjoitusta jos diagnostiikka ei vahvistanut sitä jo
    if (profile.orthography && profile.orthography.source !== 'diagnostic') {
      profile.orthography.level = Math.max(0, profile.orthography.level - 1);
    }
  }

  if (bio.livedAbroad === 'over_year') {
    Object.values(profile).forEach(p => { p.level = Math.min(5, p.level + 1); });
  }
}

/**
 * Rakenna 3 viikon suunnitelma — käytä gpt-4o-minia
 */
async function buildPlan({ lang, profile, gaps, strengths, grades }) {
  const langName = { es: 'espanjan', de: 'saksan', fr: 'ranskan' }[lang];
  const promptInput = {
    role: 'system',
    content: `Olet ${langName} YO-kokeeseen valmentava opettaja. Rakenna 3 viikon henkilökohtainen oppimispolku oppilaalle joka palautti tämän diagnostisen taso-arvion. Polku keskittyy puutteisiin (max 2 aihetta/viikko) mut säilyttää vahvuudet light-touchilla. Käytä suomi-tekstiä, sentence-case, ei em-dashia, ei "elevate/seamless" -tyyppisiä sanoja. Vastaa JSON-muodossa: { week1: [...max 4 toimintaa lyhyenä lauseena], week2: [...], week3: [...] }`,
  };
  const userPrompt = JSON.stringify({ profile, gaps, strengths, grades });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [promptInput, { role: 'user', content: userPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });
  return JSON.parse(response.choices[0].message.content);
}
```

### 3. Reitti `routes/personalization.js`

```js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildSkillProfile } from '../lib/personalization.js';
import { supabase } from '../supabase.js';

const router = express.Router();

router.post('/build-profile', requireAuth, async (req, res) => {
  const { data: diagnostic } = await supabase
    .from('user_onboarding_diagnostic')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!diagnostic) return res.status(404).json({ error: 'No diagnostic data' });

  const result = await buildSkillProfile({
    lang: diagnostic.language,
    miniYO: diagnostic.mini_yo_status === 'skipped' ? null : {
      partA: diagnostic.mini_yo_part_a_score,
      partB: diagnostic.mini_yo_part_b_score,
      partC: diagnostic.mini_yo_part_c_writing,
    },
    coursesCompleted: diagnostic.courses_completed,
    courseGrades: diagnostic.course_grades,
    biography: diagnostic.biography,
    textbookKey: diagnostic.textbook_key,
  });

  // Tallenna takaisin profilejen ja painotusten kanssa
  await supabase
    .from('user_onboarding_diagnostic')
    .update({ inferred_skill_profile: result })
    .eq('id', diagnostic.id);

  res.json(result);
});

export default router;
```

### 4. Exercise-painotus `routes/exercises.js` -päivitys

Olemassa oleva `routes/exercises.js` POST `/generate` -reitti pitää päivittää lukemaan `inferred_skill_profile.courseWeights` ja painottamaan exercise-pool:n sen mukaan:

```js
// Pseudo: kun valitaan harjoituksia mistä kurssista
function pickWeightedCourse(weights) {
  // weights = { 'kurssi_1': 0.5, 'kurssi_6': 3.0, ... }
  // Painottava arpa: ne kurssit joiden paino on yli 1, niiden todennäköisyys kasvaa
  // ne joiden paino on alle 1, todennäköisyys laskee
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const [course, w] of Object.entries(weights)) {
    acc += w;
    if (r <= acc) return course;
  }
}
```

### 5. Transparency-UI -tuki

Endpoint `GET /api/personalization/why?topic=subjunctive` palauttaa human-readable selityksen miksi käyttäjälle näytetään tämä aihe. Esim:
- *"Tämä harjoitus on listallasi koska diagnostisessa testissä et tunnistanut subjunktiivin preesensiä, ja arvosanasi K6:sta oli 7."*
- *"Tämä on kertausta vahvasta alueestasi — pidetään taito yllä."*

UI näyttää tämän napin painalluksella jokaisen harjoituksen vieressä. (UI-rakenne L-V293:ssa, vain backend-endpoint tässä.)

## Mitä EI muuteta tässä loopissa

- Onboarding-UI (L-V293 hoiti)
- Mini-YO -sisältö (L-V293 commit 2)
- Lukio-mapping-data (L-V292 hoiti)
- Lesson-sisältö, kurssirakenne
- Re-evaluation-logiikka (myöhemmin oma loop L-V295-REASSESS-1)
- Stripe / Pro-gate
- App-shell, sidebar

## Testit

```js
// tests/personalization.test.js
import { buildSkillProfile } from '../lib/personalization.js';

describe('buildSkillProfile', () => {
  it('Marcel scenario: heritage speaker, K3+K4+K6+K7, mixed grades', async () => {
    const result = await buildSkillProfile({
      lang: 'es',
      miniYO: {
        partA: { scoresByTopic: { subjunctive_present: 0.3, preterite: 0.9 } },
        partB: { score: 0.85 },
        partC: { orthography_score: 0.4, grammar_score: 0.7, vocab_score: 0.8, used_grammar_topics: ['preterite'] },
      },
      coursesCompleted: [3, 4, 6, 7],
      courseGrades: { 3: 8, 4: 9, 6: 7, 7: 8 },
      biography: { homeUsage: 'yes', livedAbroad: 'none', frequency: 'weekly' },
      textbookKey: 'mi_mundo',
    });

    // Vahvuudet
    expect(result.strengths).toContain(expect.stringMatching(/puheen ymm/i));
    expect(result.skillProfile.oral_comprehension.level).toBeGreaterThanOrEqual(4);

    // Puutteet
    expect(result.gaps).toContain(expect.stringMatching(/oikeinkirjoitus/i));
    expect(result.gaps).toContain(expect.stringMatching(/subjunktiivi/i));
    expect(result.skillProfile.orthography.level).toBeLessThanOrEqual(2);
    expect(result.skillProfile.subjunctive_present.level).toBeLessThanOrEqual(2);

    // Painotukset
    expect(result.courseWeights['kurssi_6']).toBeGreaterThan(1.5);
    expect(result.courseWeights['kurssi_1']).toBeLessThan(1);

    // Suunnitelma
    expect(result.plan.week1).toBeInstanceOf(Array);
    expect(result.plan.week1.length).toBeGreaterThan(0);
  });

  it('Skip-mini-YO scenario uses only courses + biography', async () => {
    const result = await buildSkillProfile({
      lang: 'es',
      miniYO: null,
      coursesCompleted: [1, 2, 3],
      courseGrades: { 1: 7, 2: 8, 3: 7 },
      biography: { homeUsage: 'no', livedAbroad: 'none', frequency: 'monthly' },
      textbookKey: null,  // ei näytetty disambiguatoria
    });

    // Profile on alemmalla confidence-tasolla
    Object.values(result.skillProfile).forEach(p => {
      expect(p.confidence).toBeLessThanOrEqual(0.5);
    });

    // Ei subjunktiivia (ei käynyt K6+)
    expect(result.skillProfile.subjunctive_present?.level || 0).toBe(0);
  });

  it('Transparency reasons explain why each topic is weighted', async () => {
    const result = await buildSkillProfile({
      lang: 'es',
      miniYO: { partA: { scoresByTopic: { subjunctive_present: 0.2 } }, partB: { score: 0.5 } },
      coursesCompleted: [6],
      courseGrades: { 6: 7 },
      biography: { homeUsage: 'no' },
      textbookKey: 'mi_mundo',
    });

    expect(result.transparencyReasons.subjunctive_present).toMatch(/diagnostisessa testissä/i);
  });
});
```

## Verify-protokolla

1. `node --check` läpi `lib/personalization.js`:lle ja `routes/personalization.js`:lle
2. `npm test` (vitest) PASS — yllä olevat scenario-testit
3. Reitin `POST /api/personalization/build-profile` integraatiotesti yhden test-userin kanssa
4. Manuaalinen end-to-end: aja onboarding loppuun → tarkista että profile-data tallentuu Supabaseen oikein
5. Exercise-painotuksen sanity-check: aja `POST /api/exercises/generate` ja varmista että jos käyttäjän subjunktiivi-aukko on iso, K6-aiheet tulevat 3x useammin kuin K1
6. `mcp__claude_ai_Supabase__execute_sql` tarkistaa `user_onboarding_diagnostic.inferred_skill_profile` -kentän JSON-rakenteen real-datalla

## Commit-strategia

**Commit 1 (L-V294-PERSONALIZATION-REASONER-1a):** Reasoner-logiikka + routes (ilman exercise-integraatiota)
**Commit 2 (L-V294-PERSONALIZATION-REASONER-1b):** Exercise-painotus + transparency-endpoint

## Commit-viestit

```
feat(personalization): skill-profile reasoner + plan generator (L-V294-PERSONALIZATION-REASONER-1a, v295)
feat(exercises): weighted exercise pool + transparency endpoint (L-V294-PERSONALIZATION-REASONER-1b, v296)
```

## SW

EI SW-bumppia tarvita (server-side, ei frontend-asset). Mutta jos transparency-UI vaatii uutta JS:ää frontissa, bumppaa myös.

## Pending caller

- Päivitä `IMPROVEMENTS.md`-rivit
- Suunnittele L-V295-REASSESS-1 — joka 2 vk: päivitä skill-profile suorituksen perusteella
- Memory: tallenna `memory/feedback_personalization_architecture.md` joka kertoo että reasoner käyttää: kurssi-historia + arvosanat + oppikirja-mapping + diagnostinen mini-YO + biografia, ja että painotus on courseWeights:n perusteella
