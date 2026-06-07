import{a as k,b as v}from"./app-chunk-7KFQ2POU.js";import{a as f,d as $}from"./app-chunk-LF22L46I.js";import{c as u}from"./app-chunk-2SASPNNN.js";import{b as h}from"./app-chunk-CTTO4TQX.js";import"./app-chunk-T52YLBP4.js";var w={"chevron-right":'<path d="m9 18 6-6-6-6"/>',lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'};function p(s,r=""){return`<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${r}>${w[s]||""}</svg>`}var g=`
  <svg class="lp-illu" width="186" height="92" viewBox="0 0 186 92" fill="none" aria-hidden="true">
    <path d="M8 76 C 44 76, 40 30, 78 30 S 130 64, 158 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 9"/>
    <circle cx="8" cy="76" r="9" fill="var(--bg-card)" stroke="var(--success)" stroke-width="2.5" class="done"/>
    <path d="M4.5 76 L7 78.5 L11.5 73.5" stroke="var(--success)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="78" cy="30" r="6" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="120" cy="48" r="5" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
    <g class="flag">
      <path d="M158 26 V 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M158 9 h 16 l -4 6 l 4 6 h -16 z" fill="currentColor"/>
    </g>
  </svg>`;function t(s){return String(s??"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}function y(){let s=/lang=([a-z]{2})/i.exec(location.hash||"");return s?s[1].toLowerCase():["es","de","fr"].includes(u.language)?u.language:"es"}function b(s){return s==="es"?"Espanja":s==="fr"?"Ranska":s==="de"?"Saksa":s}function _(s,r,a){let o=!!s.kertausPassed,n=!s.isUnlocked,e=s.lessonsCompleted||0,l=s.lessonCount||10,i=t(s.title),m=s.description?`<div class="lp-row__desc">${t(s.description)}</div>`:"",c=`<div><div class="lp-row__title">${i}</div>${m}</div>`;if(n)return`
      <div class="lp-row lp-row--locked" data-kurssi="${t(s.key)}" aria-label="Kurssi ${r}: ${i}, lukittu">
        <span class="lp-row__num num">${r}</span>
        ${c}
        <span class="lp-row__lock">${p("lock")} Avautuu vuorollaan</span>
      </div>`;let d=`#/oppimispolku/${a}/${encodeURIComponent(s.key)}`;return o?`
      <a class="lp-row lp-row--done" href="${d}" data-kurssi="${t(s.key)}" aria-label="Kurssi ${r}: ${i}, suoritettu">
        <span class="lp-row__num num">${r}</span>
        ${c}
        <span class="lp-row__status"><span class="lesson-done">${p("circle-check")} Suoritettu</span></span>
      </a>`:`
    <a class="lp-row lp-row--active" href="${d}" data-kurssi="${t(s.key)}" aria-label="Kurssi ${r}: ${i}, ${e} / ${l} oppituntia">
      <span class="lp-row__num num">${r}</span>
      ${c}
      <span class="lp-row__status">
        <span class="pill" style="background:var(--brick);color:var(--brick-ink)"><span class="num">${e} / ${l}</span> oppituntia</span>
        ${p("chevron-right",'style="color:var(--brick)"')}
      </span>
    </a>`}function L(s,r){let a=r.filter(e=>e.kertausPassed).length,o=r.length,n=b(s);return`
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="here" aria-current="page">Oppimispolku</span>
    </nav>
    <div class="lp-head">
      <div>
        <span class="eyebrow">${t(n)} \xB7 YO-koevalmennus</span>
        <h1>Oppimispolku</h1>
        <p class="sub">${o} kurssia \xB7 ${a} suoritettu \xB7 Etene j\xE4rjestyksess\xE4.</p>
      </div>
      ${g}
    </div>
    <div class="lp-list">
      ${r.map((e,l)=>_(e,l+1,s)).join("")}
    </div>`}function C(s,r){s.innerHTML=`
    <nav class="crumbs" aria-label="Sijainti"><a href="#/aloitus">Aloitus</a></nav>
    <div class="op-error" role="alert">
      <p>${t(r||"Kursseja ei l\xF6ytynyt.")}</p>
      <a class="btn btn--primary btn--sm" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function x(s){h("screen-oppimispolku-index");let r=document.getElementById("op-root");if(!r)return;let a=s||y();r.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kursseja"><span class="sr-only">Ladataan kursseja\u2026</span></div>';let o=await f(a);if(o.length===0){C(r,"Kursseja ei viel\xE4 julkaistu t\xE4lle kielelle.");return}r.innerHTML=L(a,o),r.querySelectorAll("a.lp-row").forEach(n=>{let e=n.dataset.kurssi;e&&v(n,()=>{k("courseDetail",()=>import("./app-courseDetail-CLL3JD37.js")),$(a,e)})})}function I(s){return/^#\/oppimispolku(\?|$)/.test(s||"")?(x(),!0):!1}export{x as loadOppimispolkuIndex,I as tryRouteOppimispolkuIndex};
//# sourceMappingURL=app-oppimispolkuIndex-AOMEFO7B.js.map
