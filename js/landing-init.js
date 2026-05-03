// Landing page module init — extracted from inline <script type="module">
// in index.html so a strict CSP (script-src without 'unsafe-inline')
// can ship.
//
// Both modules are idempotent and reduced-motion-safe internally.

import { initLandingHero } from "/js/features/landingHero.js";
import { initScrollReveal } from "/js/features/scrollReveal.js";
import { installTooltip } from "/js/features/tooltip.js";

initLandingHero();
initScrollReveal();
installTooltip();
