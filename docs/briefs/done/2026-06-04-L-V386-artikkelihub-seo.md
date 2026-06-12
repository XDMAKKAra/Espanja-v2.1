# L-V386 — Artikkeli-/vinkkihub: SEO-sisältö kaikista YO-aiheista

**Numero:** käytä seuraavaa vapaata L-VXXX jos viety.

**Skill-stack:** PLANNING + `marketing-skills:content-strategy` (taksonomia + prioriteetti), `marketing-skills:programmatic-seo` (skaalattu sivugenerointi per kieli), `marketing-skills:seo-audit` + `marketing-skills:ai-seo` (on-page + AEO), `marketing-skills:schema` (Article/FAQ structured data), COPY `humanizer` (kaikki suomi-teksti), FRONTEND-M (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) artikkelimallille. **Tämä on iso, monen loopin urakka — tämä brief tekee ARKKITEHTUURIN + ENSIMMÄISEN ERÄN, ei kaikkea kerralla.**

**Rooli:** writer.

---

## Tausta

Lara (laralearn.ai) rakentaa luottamusta ja orgaanista hakunäkyvyyttä artikkeleilla: navissa "Artikkelit" + "Vinkit", aihealueina mm. kielioppi, kirjoittaminen, sanasto, YO-koe, valmistautuminen, vastaustekniikka, opiskelu. Puheolla ei ole tätä juuri lainkaan. Marcel: "Meilki pitäis olla artikkelei vitusti kaikist." Tämä on samaan aikaan luottamus- ja SEO-veto.

**Ero Laraan:** Lara myy EN/SE, Puheo ES/FR/DE → Puheon artikkelit kohdistuvat espanjan/ranskan/saksan YO-kokeisiin, missä kilpailu hakutuloksissa on ohuempi (whitespace). Älä kirjoita enkun YO-artikkeleita.

## Tavoite (tässä loopissa)

1. **Hub-arkkitehtuuri.** Reitit + sivuhierarkia: `/artikkelit` (listaus/landing), `/artikkelit/<aihe>/<slug>` artikkelisivut, `/vinkit` (lyhyet vinkit). Linkitä landingin navista (Lara-malli) + footerista. Päätä: yksi yhteinen hub kaikille kielille aihetageilla, vai per-kieli-osiot — suosittele itse `content-strategy`-skillin perusteella, perustele.
2. **Aihetaksonomia** (Marcelin lista lähtökohtana, laajenna SEO-skillillä): kielioppi, kirjoittaminen/essee, sanasto, YO-koe (rakenne+pisteytys), valmistautuminen/aikataulu, vastaustekniikka, opiskelu/oppimistekniikat. Per kieli ES/FR/DE relevantit.
3. **Artikkelimalli (template).** Yksi siisti, brändinmukainen artikkelipohja: otsikko, lyhyt ingressi, sisällysluettelo pitkille, leipäteksti, sisäiset linkit kursseihin + muihin artikkeleihin, loppu-CTA ("Harjoittele tätä Puheossa → Aloita ilmaiseksi"). Schema.org Article + tarvittaessa FAQ. Ei AI-slop-layoutia (ei 3-4 identtistä korttia, ei mono-uppercase-chippejä, ei em-dashia).
4. **Ensimmäinen erä: 3–5 artikkelia** todellisella, hyvällä sisällöllä (ei lorem, ei "coming soon"). Valitse korkeimman hakuintention aiheet (esim. "Näin kirjoitat hyvän esseen espanjan YO-kokeeseen", "Espanjan YO-kokeen rakenne ja pisteytys", "X yleisintä virhettä"). Kaikki `humanizer`-läpi.
5. **SEO-perusta:** meta title/description, OG-tagit, sisäinen linkitys, sitemap-päivitys, structured data. Aja `seo-audit` + `ai-seo` -tarkistus.

## Constraintit / kytkennät
- **Sisältö = markkinointiartikkelit, EI kurssisisältö.** Kurssisisältö (data/courses/) on jo valmis, älä koske siihen (`project_content_complete_all_langs`).
- Kaikki käyttäjälle näkyvä suomi-teksti `humanizer`-läpi (ingressit, leipä, CTA, metat).
- Ei keksittyjä todennettavia väitteitä (lukio-nimet, tarkat %-luvut, fake-asiantuntijat) — `feedback_no_fabricated_provable_claims`.
- Loppu-CTA = "Aloita ilmaiseksi" (toimii jo), ei Stripe-osto.
- Jos tämä on Marcelin mielestä liian iso yhteen looppiin: tee tässä arkkitehtuuri + template + 3 artikkelia, ja **jätä jonoon seuraava brief** "L-V38X artikkelit erä 2" (lisää aiheet). Älä yritä 30 artikkelia kerralla.

## Acceptance criteria
- `/artikkelit` + `/vinkit` reitit elävät, linkitetty navista + footerista.
- Artikkelimalli renderöityy siistinä 390px + 1440px, ei vaakavieritystä, ei AI-slopia.
- 3–5 valmista artikkelia oikealla sisällöllä, humanizer-pass.
- Schema + metat + sitemap kunnossa (seo-audit todentaa).
- `npm run build`; sw bump jos tarpeen. Verify omilla tooleilla.

## Out of scope
- Artikkeli-erät 2+ (omat loopit).
- Per-kieli-sivujen muu uudistus.
- TikTok/IG-sisältö (oma some-loop).
