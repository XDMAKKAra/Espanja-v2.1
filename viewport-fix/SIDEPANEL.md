# Side-panel primitive

Pass 1 Step 1 specced a desktop "side affordance" for exercise feedback, hints, and
rubric panels. Gate C.5 shipped the CSS primitive behind the `ff_side_panel` feature
flag; no screen adopted it. Pass 1.5 drops the flag so the pattern is live by default.

## Markup

```html
<div class="split">
  <div class="split__main">
    <!-- exercise, editor, detail view -->
  </div>
  <aside class="split__aside">
    <!-- feedback, hints, rubric, word count, "Kokeile vaikeampaa →" -->
  </aside>
</div>
```

## Behaviour

- `<1200 px` — `.split` renders as a normal block; the aside flows under the main
  column with `margin-top: var(--s-4)`. Phones and tablets are unaffected.
- `≥1200 px` — `.split` becomes a 2-column grid: main flexes, aside is a sticky
  380 px rail anchored 64 px + 32 px below the top-nav, max-height capped at
  `100vh - 112 px`, scrolls internally when content overflows.
- Empty `.split__aside` fades to `opacity: 0` + `pointer-events: none` so screens
  can render the aside container optimistically and let it reveal when content
  lands in it.

## Adoption status

- Primitive CSS: `css/components/side-panel.css` — live, not flag-gated.
- Consumers: none yet. Exercise / writing wiring is a JS change in
  `js/screens/exerciseRenderer.js` and `js/screens/writing.js` and is **deferred**
  to a later pass (see viewport-fix/POSTSHIP.md → Deferred).
- Tests: `tests/side-panel.test.js` guards the CSS contract (no flag coupling).

## Adoption guide for future screens

1. In `app.html` (or dynamically in the screen's render fn), wrap the screen
   content in `.split` with `.split__main` + `.split__aside`.
2. Render feedback / rubric / hint content into `.split__aside` instead of the
   main column. Leave it empty until content arrives — it fades out on its own.
3. Do **not** move primary interactive elements into the aside — it's secondary
   content only. Keyboard focus stays in the main column.
4. No new tokens are required: the primitive uses `--s-4`, `--s-5`, `--s-6`,
   `--s-8`, `--r-lg`, `--sh-rest`, `--surface`, `--border`.
