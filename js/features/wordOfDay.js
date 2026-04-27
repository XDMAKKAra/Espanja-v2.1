// Word of the day — curated B1–B2 vocabulary aligned with YO-koe (lyhyt oppimäärä) themes.
// Deterministic rotation: same word for everyone on the same UTC day.
// Words rotate; one full cycle ≈ 50 days.

const WORDS = [
  { es: "el medio ambiente", fi: "ympäristö", pos: "subst.", ex_es: "Tenemos que proteger el medio ambiente.", ex_fi: "Meidän on suojeltava ympäristöä." },
  { es: "ahorrar", fi: "säästää", pos: "verbi", ex_es: "Quiero ahorrar dinero para viajar.", ex_fi: "Haluan säästää rahaa matkustaakseni." },
  { es: "el desarrollo", fi: "kehitys", pos: "subst.", ex_es: "El desarrollo de la tecnología es rápido.", ex_fi: "Teknologian kehitys on nopeaa." },
  { es: "comprometerse", fi: "sitoutua", pos: "verbi", ex_es: "Me comprometo a estudiar todos los días.", ex_fi: "Sitoudun opiskelemaan joka päivä." },
  { es: "el reto", fi: "haaste", pos: "subst.", ex_es: "Aprender un idioma es un gran reto.", ex_fi: "Kielen oppiminen on suuri haaste." },
  { es: "preocuparse", fi: "huolestua, olla huolissaan", pos: "verbi", ex_es: "Mis padres se preocupan por mi futuro.", ex_fi: "Vanhempani ovat huolissaan tulevaisuudestani." },
  { es: "sin embargo", fi: "kuitenkin", pos: "konj.", ex_es: "Es difícil; sin embargo, vale la pena.", ex_fi: "Se on vaikeaa; kuitenkin se kannattaa." },
  { es: "la sociedad", fi: "yhteiskunta", pos: "subst.", ex_es: "La sociedad cambia muy rápido.", ex_fi: "Yhteiskunta muuttuu hyvin nopeasti." },
  { es: "exigir", fi: "vaatia", pos: "verbi", ex_es: "El profesor nos exige mucho.", ex_fi: "Opettaja vaatii meiltä paljon." },
  { es: "imprescindible", fi: "välttämätön", pos: "adj.", ex_es: "Es imprescindible saber idiomas hoy.", ex_fi: "Kielten osaaminen on nykyään välttämätöntä." },
  { es: "darse cuenta de", fi: "tajuta, huomata", pos: "verbi", ex_es: "Me di cuenta de mi error tarde.", ex_fi: "Tajusin virheeni myöhään." },
  { es: "aprovechar", fi: "hyödyntää", pos: "verbi", ex_es: "Hay que aprovechar las oportunidades.", ex_fi: "Mahdollisuuksia kannattaa hyödyntää." },
  { es: "el bienestar", fi: "hyvinvointi", pos: "subst.", ex_es: "El deporte mejora el bienestar mental.", ex_fi: "Liikunta parantaa henkistä hyvinvointia." },
  { es: "el cambio climático", fi: "ilmastonmuutos", pos: "subst.", ex_es: "El cambio climático afecta a todos.", ex_fi: "Ilmastonmuutos vaikuttaa kaikkiin." },
  { es: "soler + inf.", fi: "olla tapana", pos: "verbi", ex_es: "Suelo levantarme a las siete.", ex_fi: "Minulla on tapana herätä seitsemältä." },
  { es: "el / la joven", fi: "nuori", pos: "subst.", ex_es: "Muchos jóvenes usan redes sociales.", ex_fi: "Monet nuoret käyttävät sosiaalista mediaa." },
  { es: "echar de menos", fi: "kaivata", pos: "ilmaus", ex_es: "Echo de menos a mi familia.", ex_fi: "Kaipaan perhettäni." },
  { es: "la huella", fi: "jälki, jalanjälki", pos: "subst.", ex_es: "Cada uno deja una huella en el planeta.", ex_fi: "Jokainen jättää jäljen planeetalle." },
  { es: "lograr", fi: "saavuttaa, onnistua", pos: "verbi", ex_es: "Logré aprobar el examen.", ex_fi: "Onnistuin läpäisemään kokeen." },
  { es: "a pesar de", fi: "huolimatta", pos: "prep.", ex_es: "A pesar de la lluvia, salimos.", ex_fi: "Sateesta huolimatta lähdimme." },
  { es: "la red social", fi: "sosiaalinen media", pos: "subst.", ex_es: "Pasamos demasiado tiempo en las redes sociales.", ex_fi: "Vietämme liikaa aikaa sosiaalisessa mediassa." },
  { es: "el estrés", fi: "stressi", pos: "subst.", ex_es: "Los exámenes causan mucho estrés.", ex_fi: "Kokeet aiheuttavat paljon stressiä." },
  { es: "compartir", fi: "jakaa", pos: "verbi", ex_es: "Comparto un piso con dos amigos.", ex_fi: "Asun yhteisessä asunnossa kahden ystävän kanssa." },
  { es: "la convivencia", fi: "yhteiselo", pos: "subst.", ex_es: "La convivencia exige respeto.", ex_fi: "Yhteiselo vaatii kunnioitusta." },
  { es: "merecer la pena", fi: "olla vaivan arvoista", pos: "ilmaus", ex_es: "Estudiar idiomas merece la pena.", ex_fi: "Kielten opiskelu on vaivan arvoista." },
  { es: "el paro", fi: "työttömyys", pos: "subst.", ex_es: "El paro juvenil sigue siendo alto.", ex_fi: "Nuorten työttömyys on edelleen korkea." },
  { es: "la beca", fi: "stipendi, apuraha", pos: "subst.", ex_es: "Conseguí una beca para estudiar fuera.", ex_fi: "Sain stipendin opiskellakseni ulkomailla." },
  { es: "tomar conciencia", fi: "tulla tietoiseksi", pos: "ilmaus", ex_es: "Tomamos conciencia del problema.", ex_fi: "Tulimme tietoisiksi ongelmasta." },
  { es: "fomentar", fi: "edistää", pos: "verbi", ex_es: "La escuela fomenta el trabajo en equipo.", ex_fi: "Koulu edistää tiimityötä." },
  { es: "la igualdad", fi: "tasa-arvo", pos: "subst.", ex_es: "Luchamos por la igualdad de género.", ex_fi: "Taistelemme sukupuolten tasa-arvon puolesta." },
  { es: "actualmente", fi: "nykyään", pos: "adv.", ex_es: "Actualmente vivo en Madrid.", ex_fi: "Asun nykyään Madridissa." },
  { es: "rechazar", fi: "hylätä, kieltäytyä", pos: "verbi", ex_es: "Rechacé la oferta de trabajo.", ex_fi: "Kieltäydyin työtarjouksesta." },
  { es: "la salud mental", fi: "mielenterveys", pos: "subst.", ex_es: "La salud mental es tan importante como la física.", ex_fi: "Mielenterveys on yhtä tärkeää kuin fyysinen terveys." },
  { es: "involucrarse", fi: "osallistua, sitoutua", pos: "verbi", ex_es: "Quiero involucrarme en proyectos sociales.", ex_fi: "Haluan osallistua sosiaalisiin projekteihin." },
  { es: "el rendimiento", fi: "suoritus, suorituskyky", pos: "subst.", ex_es: "Dormir bien mejora el rendimiento escolar.", ex_fi: "Hyvät yöunet parantavat koulumenestystä." },
  { es: "renovable", fi: "uusiutuva", pos: "adj.", ex_es: "Apostamos por las energías renovables.", ex_fi: "Panostamme uusiutuviin energialähteisiin." },
  { es: "el / la inmigrante", fi: "maahanmuuttaja", pos: "subst.", ex_es: "Los inmigrantes enriquecen la cultura local.", ex_fi: "Maahanmuuttajat rikastuttavat paikallista kulttuuria." },
  { es: "el porvenir", fi: "tulevaisuus", pos: "subst.", ex_es: "Pienso mucho en mi porvenir.", ex_fi: "Ajattelen paljon tulevaisuuttani." },
  { es: "afrontar", fi: "kohdata, käsitellä", pos: "verbi", ex_es: "Hay que afrontar los problemas con calma.", ex_fi: "Ongelmat on kohdattava rauhallisesti." },
  { es: "tener éxito", fi: "menestyä", pos: "ilmaus", ex_es: "Tuvo mucho éxito en sus estudios.", ex_fi: "Hän menestyi opinnoissaan." },
  { es: "imprevisto", fi: "odottamaton", pos: "adj.", ex_es: "Surgió un problema imprevisto.", ex_fi: "Esiin tuli odottamaton ongelma." },
  { es: "la herramienta", fi: "työkalu", pos: "subst.", ex_es: "La IA es una herramienta útil.", ex_fi: "Tekoäly on hyödyllinen työkalu." },
  { es: "ponerse de acuerdo", fi: "päästä yksimielisyyteen", pos: "ilmaus", ex_es: "No nos pusimos de acuerdo sobre la película.", ex_fi: "Emme päässeet yksimielisyyteen elokuvasta." },
  { es: "el desafío", fi: "haaste", pos: "subst.", ex_es: "El desafío más grande es empezar.", ex_fi: "Suurin haaste on aloittaminen." },
  { es: "valer la pena", fi: "kannattaa", pos: "ilmaus", ex_es: "Vale la pena practicar a diario.", ex_fi: "Kannattaa harjoitella päivittäin." },
  { es: "agotador, -a", fi: "uuvuttava", pos: "adj.", ex_es: "Fue una semana agotadora.", ex_fi: "Se oli uuvuttava viikko." },
  { es: "la diversidad", fi: "monimuotoisuus", pos: "subst.", ex_es: "La diversidad nos hace más fuertes.", ex_fi: "Monimuotoisuus tekee meistä vahvempia." },
  { es: "preferir + inf.", fi: "mieluummin tehdä", pos: "verbi", ex_es: "Prefiero estudiar por la mañana.", ex_fi: "Opiskelen mieluummin aamulla." },
  { es: "la presión", fi: "paine", pos: "subst.", ex_es: "Siento mucha presión por aprobar.", ex_fi: "Tunnen paljon painetta läpäisemisestä." },
  { es: "ponerse nervioso, -a", fi: "hermostua", pos: "ilmaus", ex_es: "Me pongo nervioso antes de los exámenes.", ex_fi: "Hermostun ennen kokeita." },
];

// Pick the index for a given epoch ms (default: now). Same value for the whole UTC day.
export function pickIndex(epoch = Date.now()) {
  const day = Math.floor(epoch / 86400000);
  return ((day % WORDS.length) + WORDS.length) % WORDS.length;
}

export function getWordOfDay(epoch = Date.now()) {
  return WORDS[pickIndex(epoch)];
}

export function getWordCount() {
  return WORDS.length;
}

// Render the word-of-day block into a target element. Idempotent — safe to call repeatedly.
export function renderWordOfDayInto(el) {
  if (!el) return;
  const w = getWordOfDay();
  el.innerHTML = `
    <div class="word-of-day__head">
      <span class="word-of-day__es">${w.es}</span>
      <span class="word-of-day__pos">${w.pos}</span>
    </div>
    <div class="word-of-day__fi">${w.fi}</div>
    <div class="word-of-day__ex">
      <p class="word-of-day__ex-es" lang="es">${w.ex_es}</p>
      <p class="word-of-day__ex-fi" lang="fi">${w.ex_fi}</p>
    </div>`;
}
