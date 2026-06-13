# L-V414 — jäljellä oleva työ (runbook, liitettävissä uuteen chattiin)

Liitä tämä KOKONAAN yhteen chattiin (Claude Code / Fable). Tämä on ajettava ohje, ei
keskustelu. Vaihe 0 on JO TEHTY ja committattu (`ccf6561`). ÄLÄ tee sitä uudestaan.

## Lähtötila (älä tarkista uudestaan, luota tähän)

- `node scripts/validate-content.mjs` → **P0 = 0**, P1 = 41, P2 = 9. Pidä P0 nollassa.
- Vaihe 0 korjasi: 889 `___`→`{N}` gap_fill, 38 saksan Konjunktiv-gap, 41 mc-duplikaattia,
  12 gap-mismatchia, 3 match-skeemaa, 1 vastausavain. Yksityiskohdat: `docs/audits/l-v414-RAPORTTI.md`.
- Koneellinen taso on valmis. Jäljellä on **semanttinen vastausavain-tarkastus** (rakenne ei
  näe väärää-mutta-renderöityvää vastausta) + 2 pientä siivousta.

## Globaalit guardrailit (rikkomatta)

1. **ÄLÄ reformatoi tiedostoja.** Lesson-JSONit ovat vaihtelevaa muotoilua (osa yksi-item-rivi,
   osa multi-line). Käytä tekstipohjaista kohdistettua korvausta, EI `JSON.parse`+`JSON.stringify`
   koko tiedostolle. git-diffin pitää olla luettavissa riviltä.
2. **Aja `node scripts/validate-content.mjs` jokaisen muutoserän jälkeen.** P0 ei saa nousta.
3. **ÄLÄ korjaa 41 P1:tä massana.** Listaa vain, Marcel päättää. (`docs/audits/l-v414-genuine-p0-queue.json`)
4. **Oikeaa vastausta (`correct_index`/`accept`/`answers`) muuttaessasi:** verifioi itse kieliopilla
   ENNEN kirjoitusta. Jos epäröit, kirjaa kiistanalaiseksi äläkä muuta.
5. Sisältökorjaukset ovat user-facing → commit + push. Yksi rivi IMPROVEMENTS.md:hen (uusin ylimmäs).

---

## TASK 1 — fondent-vastausavainvirhe (varma, ~2 min)

Tiedosto `data/courses/fr/kurssi_6/lesson_7.json`, phase `p1-recognition-mc-laukaisijat2`, item #11.

Nyt: `choices: ["fondent","fondront","fondaient","fonde"]`, `correct_index: 3` ("fonde").
Virhe: *les glaciers* on 3. monikko → subjonctif = **fondent** (idx 0), ei "fonde" (3. yks).
Stemin oma vihje vahvistaa: "ils fondent → fond-".

Korjaa:
- `correct_index` **3 → 0**.
- `explanation` siistiksi (poista "Hmm…"-itseepäily), esim:
  `"J'ai peur que + subjonctif. 'Les glaciers' on monikko → fondent (subjonctif = présent-muoto -re-verbillä). 'Fonde' olisi yksikkö."`

Aja validaattori (pysyy P0=0).

---

## TASK 2 — fr-vocab `es`-avain -haju (selvitys, sitten päätös)

Ranskan oppituntien `vocab[]` käyttää paikoin `es`-kieliavainta:
`{"es":"la COP21","fi":"…"}` fr-lessonissa (löytyi fr/kurssi_6/lesson_12).

Tee ensin laajuuskartoitus (ei korjausta vielä):
```
node -e '
const fs=require("fs"),path=require("path");
let hits=[];
for(const k of fs.readdirSync("data/courses/fr").filter(d=>d.startsWith("kurssi_")))
  for(const f of fs.readdirSync(path.join("data/courses/fr",k)).filter(x=>x.endsWith(".json"))){
    const l=JSON.parse(fs.readFileSync(path.join("data/courses/fr",k,f),"utf8"));
    (l.vocab||[]).forEach((v,i)=>{ if("es" in v && !("fr" in v)) hits.push(`fr/${k}/${f} vocab#${i}: ${v.es}`); });
  }
console.log("fr-vocab es-avaimella:",hits.length); hits.slice(0,20).forEach(h=>console.log("  "+h));
'
```
- Jos osumia on **vähän** (< ~20): korjaa `es`→`fr` ja `example_es`→`example_fr` kohdistetulla
  tekstikorvauksella per item. Tarkista frontin vocab-renderöinti (`js/screens/vocab.js`,
  `js/screens/digikirja.js` vocab-haara) — mitä avainta se lukee fr-kurssilla. Jos frontti
  lukee kielikohtaisen avaimen kurssin kielen mukaan, `es`-avain = sana ei näy → P0-luokkaa.
  Jos frontti fallbäckää (es||fr||de), kosmeettinen.
- Jos osumia on **paljon** (sadat): ÄLÄ korjaa sokkona. Kirjaa löytö, kerro Marcelille laajuus,
  tee erillinen brief. Voi olla porttausvirhe joka koskee koko fr-sisältöä.

---

## TASK 3 — semanttinen vastausavain-pass (iso, KYSY LUPA ennen ajoa)

Tämä on se kallis osa jonka Marcel lykkäsi. **Älä aja sitä kysymättä.** Kysy:
"Ajetaanko es-gauge (~600k tokenia) vai täysi es+fr+de (~2M)?"

Kun lupa tulee, käytä alkuperäisen briefin `docs/briefs/2026-06-12-L-V414-tehtavien-lopputarkastus.md`
**Vaihe 1 -arkkitehtuuria** (ekstraktiosheetit + per-kurssi×kieli Sonnet-agentit). Pakolliset
token-säästösäännöt sieltä:
- Kirjoita `scripts/extract-review-sheets.mjs` joka tuottaa per kurssi×kieli yhden kompaktin
  tekstitiedoston (vain tarkastettavat kentät riveinä, ei teoria-md:tä, ei mastery-thresholdeja).
- Yksi Sonnet-subagentti per kurssi×kieli (`Agent` tool, `model: "sonnet"`), 6–8 rinnakkain.
  Subagentit EIVÄT lataa skillejä (rubriikki upotetaan promptiin, ks. briefin subagentti-prompt).
- Subagentin output = pelkkä JSON-array löydöksiä, ei esseitä, tyhjä lista OK.

**Gauge-logiikka:** aja ensin pelkkä es (8 oppitunti-agenttia + 1 pankki-agentti). Katso
löydöstiheys. Jos es löytää ≥1 väärän vastausavaimen → fr+de **täytenä** (ei otantana —
otanta ei kelpaa vastausavain-luokkaan). Jos es on puhdas → fr+de voi ottaa joka 2. oppitunti.

Korjaa P0-vastausavainvirheet vasta verifioituasi jokaisen itse (agentin ehdotus voi olla väärä).
Loppuraportti: `docs/audits/l-v414-Vaihe1-RAPORTTI.md`.

---

## Acceptance (koko L-V414)

- Validaattori P0 = 0 (pysyy).
- Task 1 korjattu, Task 2 selvitetty (korjattu tai briiffattu laajuuden mukaan).
- Task 3 joko ajettu (luvalla) tai odottaa eksplisiittisesti Marcelin lupaa.
- Ei massamuutoksia joita ei voi perustella riviltä. git-diff luettavissa.
