import{a as n,b as o}from"./app-chunk-2PNFTTVN.js";import{d as e}from"./app-chunk-M4LELO7W.js";var s="puheo_analytics_consent_v1";function i(){try{let t=localStorage.getItem(s);return t==="granted"||t==="denied"?t:null}catch{return null}}function c(t){try{localStorage.setItem(s,t)}catch{}}function l(){c("granted"),n(null,e())}function d(){c("denied"),o()}function f(t){return t?l():d(),i()}function x(){let t=i();if(t==="granted"){n(null,e());return}t!=="denied"&&u()}var r=!1;function b(){if(r)return;r=!0;let t=document.createElement("style");t.id="consent-banner-styles",t.textContent=`
.consent-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 60;
  max-width: 440px;
  margin-left: auto;
  display: grid;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--border, rgba(60,46,33,0.14));
  background: var(--surface, #fbf6ec);
  color: var(--text, #2c2417);
  box-shadow: 0 18px 40px -18px rgba(40,28,16,0.45);
  transform: translateY(8px);
  opacity: 0;
  transition: transform 240ms cubic-bezier(0.23,1,0.32,1), opacity 240ms cubic-bezier(0.23,1,0.32,1);
}
.consent-banner[data-shown="true"] { transform: translateY(0); opacity: 1; }
.consent-banner__title { font-weight: 650; font-size: 15px; margin: 0; }
.consent-banner__body { font-size: 13.5px; line-height: 1.55; margin: 0; color: var(--text-muted, #6b5d49); }
.consent-banner__body a { color: var(--accent, #b3502e); text-decoration: underline; }
.consent-banner__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.consent-banner__btn {
  flex: 1 1 auto;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 12px;
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 140ms ease-out, background-color 140ms ease;
}
.consent-banner__btn:active { transform: scale(0.98); }
.consent-banner__btn--primary { background: var(--accent, #b3502e); color: #fff; }
.consent-banner__btn--quiet {
  background: transparent;
  color: var(--text, #2c2417);
  border-color: var(--border, rgba(60,46,33,0.2));
}
@media (prefers-reduced-motion: reduce) {
  .consent-banner { transition: opacity 160ms ease; transform: none; }
  .consent-banner[data-shown="true"] { transform: none; }
  .consent-banner__btn:active { transform: none; }
}
`,document.head.appendChild(t)}function u(){if(document.getElementById("consent-banner"))return;b();let t=document.createElement("section");t.id="consent-banner",t.className="consent-banner",t.setAttribute("role","dialog"),t.setAttribute("aria-live","polite"),t.setAttribute("aria-label","Ev\xE4stesuostumus"),t.innerHTML=`
    <p class="consent-banner__title">Ev\xE4steet ja analytiikka</p>
    <p class="consent-banner__body">
      V\xE4ltt\xE4m\xE4tt\xF6m\xE4t ev\xE4steet pit\xE4v\xE4t kirjautumisen ja asetukset toiminnassa. Haluaisimme
      k\xE4ytt\xE4\xE4 my\xF6s PostHog-analytiikkaa n\xE4hd\xE4ksemme, mik\xE4 sovelluksessa toimii ja mik\xE4 ei.
      Se on vapaaehtoista. <a href="/privacy.html" target="_blank" rel="noopener">Lue tietosuojaselosteesta</a>.
    </p>
    <div class="consent-banner__actions">
      <button type="button" class="consent-banner__btn consent-banner__btn--quiet" id="consent-decline">Vain v\xE4ltt\xE4m\xE4tt\xF6m\xE4t</button>
      <button type="button" class="consent-banner__btn consent-banner__btn--primary" id="consent-accept">Hyv\xE4ksy analytiikka</button>
    </div>
  `,document.body.appendChild(t),requestAnimationFrame(()=>t.setAttribute("data-shown","true"));let a=()=>{t.setAttribute("data-shown","false"),setTimeout(()=>t.remove(),260)};t.querySelector("#consent-accept").addEventListener("click",()=>{l(),a()}),t.querySelector("#consent-decline").addEventListener("click",()=>{d(),a()})}export{i as a,f as b,x as c};
//# sourceMappingURL=app-chunk-OSCMICL7.js.map
