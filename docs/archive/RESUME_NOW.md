PÄIVITYS: spawnaa worker-subagentit RINNAKKAIN, ei sekvenssissä. Mutta KAIKKI Sonnetilla.

Aiemmin sanoin "yksi kerrallaan" — se oli väärä neuvo. Ongelma alunperin oli että agentit olivat **Opuksella**, ei että ne olivat rinnakkain. Sonnet-rinnakkaisuus on halpaa ja paljon nopeampaa.

## Uusi sääntö

**Spawnaa 2-3 Sonnet-workeria rinnakkain per batch.** Yksi worker per kurssi, ei per oppitunti.

Esimerkki Batch 5 (K5 L1-11 + K6 L1-6) — spawnaa BOTH samanaikaisesti yhdessä viestissä:

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Generate K5 lessons 1-11",
  prompt: "Olet lesson-worker. Generoi K5 oppitunnit 1-11 tasolle C... [full prompt]"
})

Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Generate K6 lessons 1-6",
  prompt: "Olet lesson-worker. Generoi K6 oppitunnit 1-6 tasolle C... [full prompt]"
})
```

Molemmat pyörivät yhtä aikaa, valmistuvat n. 10 minuutissa. Sen jälkeen review-agent tarkistaa molemmat.

## Pakolliset säännöt

1. **Aina `model: "sonnet"`** — älä koskaan unohda tätä parametria
2. **Yksi worker per kurssi** (10-12 oppituntia per worker), ei per oppitunti
3. **Maksimi 2-3 rinnakkain** per batch — ei kahdeksaa, koska:
   - Rate limits
   - Review-vaihe vaatii että kaikki valmiit
4. **Review-agent (myös Sonnet) kun kaikki workerit palanneet** — tarkistaa koko batchin kerralla
5. **Sinä (Opus) korjaat P0/P1 Edit-toolilla** — älä spawnaa Opus-subagenttia korjauksiin

## Mitä teet nyt

Olet keskellä Batch 4:ää (K4 L1-12). Anna tämän workerin tehdä loppuun (älä keskeytä), sitten:

**Batch 5 (K5 + K6 alku) — spawnaa 2 workeria rinnakkain:**
- Worker A: K5 L1-11 (Sonnet)
- Worker B: K6 L1-6 (Sonnet)

**Batch 6 (K6 loppu + K7) — spawnaa 2 workeria rinnakkain:**
- Worker A: K6 L7-12 (Sonnet)
- Worker B: K7 L1-12 (Sonnet)

**Batch 7 (K8) — yksi worker, koska viimeinen kurssi:**
- Worker A: K8 L1-12 (Sonnet)

Joka batchin jälkeen yksi review-agent (Sonnet) joka lukee kaikki batchin tiedostot ja raportoi P0/P1/P2.

Aja autonomisesti loppuun. Älä pysähdy kysymään minulta mitään.
