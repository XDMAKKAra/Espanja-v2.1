# Puheo course content

JSON-tiedostot, yksi per oppitunti. Validoidaan `schemas/lesson.json`-vasten.

## Generointi

Yksi oppitunti kerrallaan, käyttäjän omassa Claude Code -istunnossa
prompin `PROMPT_GENERATE_LESSON.md` mukaan. Käyttäjä committaa
generoidut tiedostot.

## Validointi

```
npm run validate:lessons
```

## Käyttö backendissa

`routes/curriculum.js` lukee `data/courses/{course_key}/lesson_{index}.json`
kun `USE_PREGENERATED_LESSONS=true` ympäristömuuttuja asetettu.
Muuten fallback runtime OpenAI -generointiin.

Placeholder-tiedostot (joiden `meta.description` alkaa "PLACEHOLDER")
ohitetaan — niitä ei serveata käyttäjälle, fallback OpenAI:hin
laukaisuun.
