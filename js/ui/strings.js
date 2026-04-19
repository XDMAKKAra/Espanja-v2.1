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

  // Hints
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
