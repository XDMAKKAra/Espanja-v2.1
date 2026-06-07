// L-V399 C3 — dashboard motivation copy + picker extracted from
// js/screens/dashboard.js to start shrinking that god-screen. Behavior-
// preserving: the MOTIVATION table and pickMotivation() are moved verbatim.
// pickMotivation is deterministic given the UTC day (rotates the line daily).

// Variable, context-aware Finnish motivation. Rotates daily so the dashboard
// doesn't repeat the same line for a week of practice.
const MOTIVATION = {
  zero: [
    "Aloita ensimmäinen harjoitus, pieni alku riittää.",
    "Yksi harjoitus tänään, ja olet käynnissä.",
    "Pieni alku tänään → suurempi ote ensi viikolla.",
  ],
  zeroStreak: [
    "Jatka harjoittelua tänään, pieni rutiini riittää.",
    "Tänään paras päivä aloittaa uusi putki.",
    "10 minuuttia espanjaa, ja tilanne paranee.",
  ],
  ones: [
    "Hyvä alku, tee yksi harjoitus jatkaaksesi.",
    "Putki kasvaa askel kerrallaan.",
    "Yksi harjoitus pitää sinut mukana.",
  ],
  threes: [
    "Vauhti päällä, harjoittele tänään ja pidä putki.",
    "Tämä alkaa kuulostamaan rutiinilta. Hyvä!",
    "Kolme päivää, aivot oppivat parhaiten kertauksesta.",
    "Jatka niin, pieni päivittäinen toisto kantaa pitkälle.",
  ],
  weeks: [
    "🔥 Viikon putki, espanjasi kiittää sinua.",
    "🔥 Seitsemän päivää! YO-rutiini alkaa rakentua.",
    "🔥 Viikko espanjaa peräkkäin, ei pieni juttu.",
  ],
  months: [
    "🔥 Yli viikko mennyt, tämä on jo tapa.",
    "🔥 Putki kasvaa, pidä kiinni.",
    "🔥 Sinnikkyys palkitaan YTL-rubriikissa.",
  ],
  marathon: [
    "🔥 Kuukauden putki, tämä on todellista omistautumista.",
    "🔥 Kuukausi! Espanja on osa arkeasi.",
    "🔥 Yli 30 päivää, vauhti vie kokeeseen asti.",
  ],
};

export function pickMotivation(streak = 0, totalSessions = 0) {
  let bucket;
  if (totalSessions === 0) bucket = MOTIVATION.zero;
  else if (streak === 0) bucket = MOTIVATION.zeroStreak;
  else if (streak >= 30) bucket = MOTIVATION.marathon;
  else if (streak >= 7) bucket = streak >= 14 ? MOTIVATION.months : MOTIVATION.weeks;
  else if (streak >= 3) bucket = MOTIVATION.threes;
  else bucket = MOTIVATION.ones;
  // Rotate by UTC day so the same line doesn't repeat day-after-day.
  const day = Math.floor(Date.now() / 86400000);
  return bucket[((day % bucket.length) + bucket.length) % bucket.length];
}

// Exported for the characterization test (tests/motivation.test.js) so it can
// assert pickMotivation returns a member of the expected bucket.
export { MOTIVATION };
