# Pass 7 — Marketing push (ongoing, not gated)

From August through exam day. This pass is marketing, not engineering — no gates, no commits except SEO/blog content. Run in parallel with any late polish work.

## ⚠️ Pre-requisite: Pass 6.5 — Live payments wire-up

Before any marketing channel is activated, **marcel must have y-tunnus registered** and one short technical pass completes the live-payments work that all earlier passes deferred:

- Register LemonSqueezy account against the y-tunnus.
- Create the live Pro product + price.
- Wire `routes/stripe.js` to the live LemonSqueezy keys (env vars).
- Replace the "Coming soon — join waitlist" page on landing pricing card with the live checkout link.
- Replace the placeholder "Upgrade" button in the app with the live checkout link.
- Test the full flow: free user → click upgrade → checkout → webhook fires → Pro entitlement set in Supabase → Pro features unlocked.
- Email everyone on the waitlist that Pro is now available, with a launch discount.
- Refund flow tested.

Target: ~Aug 10–15, immediately before Channel 2 (launch email) fires.

Until this mini-pass lands, every marketing channel below points users at the waitlist, not a paid checkout.

## Skills

- `.claude/skills/internal-comms/SKILL.md` — messaging
- `.claude/skills/brand-guidelines/SKILL.md` — consistency

## Scope

Tell Finnish high schoolers the app exists. Channels, ordered by effort/reward:

## Channel 1 — SEO / Blog (already started)

- Finish Pass 3's BLOG.md plan — 10 new posts beyond the existing 5.
- Target keywords from `landing/RESEARCH.md`. Every post has an internal link to the matching exercise in-app.
- Submit sitemap to Google Search Console (verification tag already in place).
- Monitor Search Console weekly for impressions growth.

## Channel 2 — Launch email

- Collect every email from `diagnose.html` sign-ups.
- Design a launch announcement for ~Aug 15 (see EMAILS.md from Pass 4 for tone).
- Track open + click in Resend.

## Channel 3 — Reddit

- r/Finland, r/Suomi, r/LanguageLearning (English), r/SecondaryEducation if Finnish.
- Do NOT spam. Participate for 2 weeks first, post once with genuine value.
- Offer free Pro to Finnish students who engage.

## Channel 4 — Instagram + TikTok (if capacity)

- Short vertical videos showing the app in use. Tone: calm confidence, not cringe-energy.
- Captions in Finnish, voice-over in Finnish.
- Post 3× per week minimum from Aug 15.
- Measure: follows, profile→link clicks, signups from link-in-bio.

## Channel 5 — Paid ads (test only)

- €200 budget. Meta (Instagram + Facebook), targeting Finnish 17–19-year-olds interested in "Espanja", "lukio", "YO-kirjoitukset".
- Run for 1 week starting ~Aug 20. If CPA is absurd, kill. If CPA <€5, scale.
- Creative: screenshots from the app + the diagnostic promise ("Kokeile 2 minuutissa").

## Exam-week mode (Sept 21–28)

- Enable exam-week feature flag (Pass 6).
- Pin app to stable bank content. No new feature deploys.
- Daily social post: "X days left. Here's your Friday drill."
- Post-exam email: survey + thank-you + retention offer for next round (26.9.2027? if there is one).

## Measurement

Weekly report (self-written): visits, signups, conversions, $/signup, $/paid-user, retention at D1/D3/D7. Commit to `marketing/weekly-YYYY-MM-DD.md`.

## Done

- App has real users practising for the exam before 28.9.2026.
- Weekly marketing reports committed.
- Post-exam retrospective: what marketing worked, what didn't, what to do differently next exam cycle.
