/**
 * Finnish UI string table — single source per exercises/SHARED.md §7.
 *
 * New-exercise-type renderers MUST import from this module; no inline
 * Finnish strings in renderer code. If a new string is needed, add it
 * here first and land that change before the renderer that consumes it.
 *
 * Flat dot-notation keys so call sites read one path: `t("band.taydellinen")`.
 */

const STRINGS = Object.freeze({
  // Feedback bands (SHARED.md §3 band vocabulary)
  'band.taydellinen':   'Täydellinen!',
  'band.ymmarrettava':  'Ymmärrettävä',
  'band.lahella':       'Lähellä!',
  'band.vaarin':        'Vielä harjoittelua',

  // Buttons
  'btn.submit':         'Tarkista',
  'btn.next':           'Seuraava',
  'btn.skip':           'Ohita',
  'btn.retry':          'Yritä uudelleen',
  'btn.hint':           'Vihje',
  'btn.showAnswer':     'Näytä oikea vastaus',
  'btn.pair':           'Yhdistä',

  // Instructions (per type)
  'aukko.instruction':   'Täydennä aukko',
  'aukko.placeholder':   'Kirjoita vastaus…',
  'lauseen.instruction': 'Muodosta lause, joka sisältää annetut sanat',
  'lauseen.wordChip':    'Vaadittu sana',
  'kaannos.instruction': 'Käännä espanjaksi',
  'luku.instruction':    'Lue teksti ja vastaa suomeksi',
  'luku.questionN':      'Kysymys {n}/{total}',
  'luku.grading':        'Tarkistetaan vastauksia…',
  'yhdista.instruction': 'Yhdistä parit',

  // Error copy
  'err.network.title':   'Yhteys katkesi',
  'err.network.sub':     'Tarkista verkko ja yritä uudelleen',
  'err.model.title':     'Arvioija ei vastannut',
  'err.model.sub':       'Yritä hetken päästä uudelleen',
  'err.empty':           'Kirjoita vastaus ensin',
  'err.wrongLang':       'Kirjoita vastaus espanjaksi',
  'err.tooLong':         'Vastaus on liian pitkä',

  // Hint ladder
  'hint.step':           'Vihje ({step}/3)',
  'hint.auto':           'Vihje näytetty automaattisesti',
  'hint.showAnswer':     'Näytä esimerkki',
  'hint.nudge.aukko':    'Ajattele, minkälainen sana tähän kohtaan sopii lauseen merkityksen kannalta.',
  'hint.nudge.kaannos':  'Kirjoita ensin verbi tai pääsana, sitten täydennä lauseen muut osat.',
  'hint.nudge.lauseen':  'Mieti ensin, mikä on lauseen pääverbi ja mihin kohtaan se kuuluu.',
  'hint.nudge.yhdista':  'Etsi pari, jonka merkitys tuntuu tutulta. Aloita siitä.',
  'hint.nudge.mc':       'Mieti, mitä vaihtoehtoa ympäröivä lause tai tilanne vaatii.',
  'hint.nudge.correction': 'Etsi virhe lukemalla lause uudelleen ääneen mielessäsi.',
  'hint.example.label':  'Esimerkki:',
  'hint.pair.revealed':  'Näytetty',

  // Correction exercise
  'correction.instruction': 'Korjaa virhe espanjankielisessä lauseessa',
  'correction.placeholder': 'Kirjoita korjattu lause…',
  'correction.hint.cat.ser_estar':        'Pohdi: onko kyseessä pysyvä ominaisuus vai tilapäinen tila/sijainti?',
  'correction.hint.cat.agreement':        'Tarkista substantiivin suku ja luku — onko adjektiivi tai artikkeli sopusoinnussa?',
  'correction.hint.cat.tense':            'Onko kyseessä yksittäinen tapahtuma (pretérito) vai toistuva/kuvaava tila (imperfecto)?',
  'correction.hint.cat.mood':             'Vaatiiko lauseen rakenne subjunktiivia (mielipide, toive, epävarmuus)?',
  'correction.hint.cat.por_para':         'Por = syy/kesto, para = tarkoitus/kohde — kumpi sopii tähän lauseeseen?',
  'correction.hint.cat.word_order':       'Tarkista adjektiivin paikka (yleensä substantiivin jälkeen) ja negation sijainti.',
  'correction.hint.cat.missing_pronoun':  'Puuttuuko lauseesta objektipronomini tai refleksiivinen se?',
  'correction.hint.cat.aspect':           'Pretérito perfecto vai indefinido — onko tapahtuma yhteydessä nykyhetkeen?',

  // Hints (legacy feedback categories)
  'hint.spelling':       'Kirjoitusvirhe — melkein oikein',
  'hint.accent':         'Aksentti puuttuu tai on väärin',
  'hint.wordOrder':      'Tarkista sanajärjestys',
  'hint.meaning':        'Merkitys hieman sivussa',
});

/**
 * Look up a Finnish string by dot-notation key.
 * Unknown key throws — fail loud so missing keys surface immediately
 * rather than silently rendering an empty label.
 *
 * @param {string} key
 * @param {Record<string, string|number>} [vars]  optional `{name}` interpolation
 * @returns {string}
 */
export function t(key, vars) {
  const raw = STRINGS[key];
  if (typeof raw !== 'string') {
    throw new Error(`t(): no Finnish string for key "${key}"`);
  }
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v == null ? `{${name}}` : String(v);
  });
}

/** The underlying frozen table — exposed for tests and tooling only. */
export const _STRINGS = STRINGS;
