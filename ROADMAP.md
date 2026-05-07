# Puheo Roadmap

> **Elävä strategiadokumentti.** Päivitetty 2026-05-07. Kun strategia muuttuu, muokkaa tätä, älä lisää uusia rinnakkaistiedostoja.

---

## Visio

Suomen ainoa AI-pohjainen vieraiden kielten YO-kokeen valmennusalusta — espanja, saksa, ranska (lyhyet oppimäärät). Sisältö käsin tehty, AI:n rooli on arviointi + adaptiivisuus, ei generointi.

## Markkina

| Kieli | Lyhyt oppimäärä, kirjoittajia/v (2017-2025 ka.) |
|---|---|
| Saksa | 1 460 |
| Espanja | 914 |
| Ranska | 799 |
| **Yhteensä TAM** | **~3 173 / v** |

Pitkät oppimäärät (Saksa 463, Ranska 300, Espanja 109) jätetty pois — liian pieni markkina laajennukseen.

Konversiotavoite: 5% TAM:sta = ~160 maksavaa per yo-kausi (kevät + syksy) = ~320/v.

## Hinnoittelu (single-language, 3-tier)

Useimmat lukiolaiset treenaavat YO-kokeeseen 3-8 vk. Per-asiakkaan kokonaismeno on minimoitava friktion ja maksimoitava arvon mukaan tier-mallilla.

| Taso | Kk | Paketti (8 vk) | Mitä saa |
|---|---|---|---|
| **Free** | €0 | — | 1 demo-oppitunti, 1 kirjoitus, 1 luettu, 1 harjoituskoe lifetime. Ei AI-tracking, ei adaptiivisuutta. **Pelkkä testi-demo.** |
| **Treeni** | €9/kk | €19 | ∞ kirjoitustehtäviä + luettua + harjoituskokeita AI-arvioinnilla. EI rakenteellista kurssia, EI adaptiivisuutta, EI yo-valmius-mittaria, EI lukusuunnitelmaa. Käyttäjälle joka haluaa vain harjoitella. |
| **Mestari** | €19/kk | €39 | Kaikki Treenin ominaisuudet + koko 8-kurssin polku + adaptiivinen vaikeus + yo-valmius-mittari + henkilökohtainen lukusuunnitelma + virhetracking + adaptiiviset kokesimulaatiot. Täysi YO-valmennus. |

Paketit voimassa 8 viikkoa ostosta tai exam_date+7 päivää (kumpi aiemmin).

Multi-language ei ole vaiheessa 1.

Painotettu keskimääräinen liikevaihto / asiakas (mix-arvio Treeni 50% / Mestari 50%, paketti 40% / kk 60%): ~€24.
Konversiotavoite TAM:sta nousee 5% → 8-10% alemman entry-pointin ja Mestarin saavutettavan hinnan ansiosta. **Tavoite vuosittain: ~€11 000 netto.**

*Mestarin hinnoitteluperustelu:* €29/kk vertautuisi Studeoon (joka on validoitu, monivuotinen brändi). Aloittavan palvelun on oltava alle "kokeilukynnyksen" — alle €20/kk. Suhde Treeni→Mestari on 9→19 (2,1×) eikä 9→29 (3,2×) → upgrade-polku tuntuu järkevältä, ei loikalta. €39 paketti = ~2 kk:n kk-hinta = 8 vk:n YO-prep-kausi.

## AI:n rooli

EI generoi tehtäviä. Sen sijaan:
- Sanaston synonyymitarkistus (`coche` → user kirjoittaa `automobiili` → AI hyväksyy)
- Kirjoitustehtävien arviointi YO-rubriikin mukaan (gpt-4o-mini)
- Luetun ymmärtämisen arviointi
- Kokesimulaation arviointi
- Jatkuva tasoarviointi taustalla — tallentaa per-käyttäjä mihin menee usein vikaan
- Adaptiivinen seuraavan tehtävän valinta heikkojen aiheiden mukaan
- "Aina läsnä" -agenttinen sävy UI:ssa (puheo-finnish-voice)

## Sisältö

Käsin kirjoitettu, ihmistarkistettu (käyttäjä + kaverit jotka kirjoittavat ko. kielen yo:n).

| Kieli | Tila | Tarkistaja |
|---|---|---|
| Espanja lyhyt | 90 oppituntia generoitu, validoitu | Käyttäjä itse, syksy 2026 yo |
| Saksa lyhyt | TBD | Käyttäjän tuttava |
| Ranska lyhyt | TBD | Käyttäjän tuttava |

Per kieli: 8 kurssia × ~10-12 oppituntia = ~90 oppituntia. Sama rakenne kaikilla.

## Toteutusjärjestys

Käyttäjän määräämä järjestys: **sivut ennen tehtäviä**, koska tehtäviin menee eniten aikaa.

1. **L-ONBOARDING-REDESIGN-1** — täysi onboarding (kysymys-vetoinen, mind-blowing personalization). Ensimmäinen koukku, koska monet eivät ole ostaneet Prota tässä vaiheessa. → AGENT_PROMPT_ONBOARDING_REDESIGN_1.md
2. **L-LANG-LANDINGS-1** — `/espanja`, `/saksa`, `/ranska` SEO-landing-sivut + login-jälkeen oletuskielisivu (käyttäjä on aina oman kielensä SPA:ssa, ei kielinvalintaa joka login). → AGENT_PROMPT_LANG_LANDINGS_1.md
3. **L-PRICING-REVAMP-1** — €15/kk + €39 yo-paketti, Stripe-tuotteiden setup, `index.html` pricing-osio + per-language landingit. → AGENT_PROMPT_PRICING_REVAMP_1.md
4. **L-LANG-INFRA-1** — datamalli (users.target_language, users.target_level, users.exam_date), `lib/lessonLoader.js` per-kieli routing, `lib/openai.js` parametrisointi (kieli-koodi prompteissa), `lib/curriculumData.js` jako per kieli. → brief tehdään tarpeen tullen.
5. **L-LESSONS-DE-LYHYT** — saksa lyhyt 90 oppituntia (suurin TAM). Canonical-pipeline + käyttäjän tuttavan tarkistus. → brief tehdään kun infra valmis.
6. **L-LESSONS-FR-LYHYT** — ranska lyhyt 90 oppituntia. Sama pipeline.

Aikatauluttamatta — käyttäjällä ei kiirettä. Aja yksi kerrallaan.

## Markkinointi

Pää-go-to-market: **sosiaalinen media + SEO**. Ei budjettia maksulliseen mainontaan.

- TikTok / Instagram Reels — lukiolaiset etsivät yo-prep-sisältöä
- Per-language landing-sivut SEO-haut: "espanjan yo-koe valmennus", "saksan yo-koe", "ranskan yo-koe"
- Kausittainen aktiivisuus: huipputesti tammikuu-helmikuu (kevään yo) + elokuu-syyskuu (syksyn yo)
- Lukio-opettajien suosittelut myöhempi vaihe (kun sisältö on kolmella kielellä)

## Mitä EI ole roadmapilla

- Pitkät oppimäärät (sisällön määrä per käyttäjä ei vastaa markkinan kokoa)
- Englanti (markkinakoko 28 000/v houkuttelee, mutta kilpailu lyö)
- Ruotsi (osa pakollista yo:ta, ei prep-markkinaa samalla tavalla)
- Italia / latina (ei pitkiä oppimääriä, lyhyiden TAM nano)
- Speaking-osuus (Whisper STT + TTS) — myöhempi vaihe
- Lukio-tilaukset / B2B — myöhempi vaihe
- Mobile-app (PWA riittää)

## Päätösloki

- 2026-05-07: Päätetty 3 kieltä × lyhyt vain. Pitkät pois.
- 2026-05-07: AI ei generoi tehtäviä — käsin tehty sisältö.
- 2026-05-07: Hinnoittelu €15/kk + €39 yo-paketti, single-language.
- 2026-05-07: Onboarding ennen kaikkia muita uusia ominaisuuksia.
