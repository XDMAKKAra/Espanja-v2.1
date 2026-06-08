import{a as m,b as w,c as b}from"./app-chunk-HXUEWMXN.js";import{a as $,d as g}from"./app-chunk-LF22L46I.js";import{b as k}from"./app-chunk-DRZEAGMT.js";import{c as v}from"./app-chunk-2SASPNNN.js";import{b as y}from"./app-chunk-CTTO4TQX.js";import{k as f}from"./app-chunk-T52YLBP4.js";var L={"chevron-right":'<path d="m9 18 6-6-6-6"/>',lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',"lock-buy":'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'};function d(r,a=""){return`<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${a}>${L[r]||""}</svg>`}var x=`
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
  </svg>`;function o(r){return String(r??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function j(){let r=/lang=([a-z]{2})/i.exec(location.hash||"");return r?r[1].toLowerCase():["es","de","fr"].includes(v.language)?v.language:"es"}function C(r){return r==="es"?"Espanja":r==="fr"?"Ranska":r==="de"?"Saksa":r}function K(r,a,n,u){let i=!!r.kertausPassed,l=!r.isUnlocked,c=r.lessonsCompleted||0,s=r.lessonCount||10,e=o(r.title),p=r.description?`<div class="lp-row__desc">${o(r.description)}</div>`:"",t=`<div><div class="lp-row__title">${e}</div>${p}</div>`;if(u){let _=i?"done":l?"locked":"active";return`
      <div class="lp-row lp-row--buy-locked" data-kurssi="${o(r.key)}" data-progress="${_}"
           role="button" tabindex="0"
           aria-label="Kurssi ${a}: ${e}, vaatii Kurssin">
        <span class="lp-row__num num">${a}</span>
        ${t}
        <span class="lp-row__buy-cta">
          ${d("lock",'class="lp-buy-lock-icon"')}
          <span class="lp-buy-label">Avaa Kurssilla</span>
        </span>
      </div>`}if(l)return`
      <div class="lp-row lp-row--locked" data-kurssi="${o(r.key)}" aria-label="Kurssi ${a}: ${e}, lukittu">
        <span class="lp-row__num num">${a}</span>
        ${t}
        <span class="lp-row__lock">${d("lock")} Avautuu vuorollaan</span>
      </div>`;let h=`#/oppimispolku/${n}/${encodeURIComponent(r.key)}`;return i?`
      <a class="lp-row lp-row--done" href="${h}" data-kurssi="${o(r.key)}" aria-label="Kurssi ${a}: ${e}, suoritettu">
        <span class="lp-row__num num">${a}</span>
        ${t}
        <span class="lp-row__status"><span class="lesson-done">${d("circle-check")} Suoritettu</span></span>
      </a>`:`
    <a class="lp-row lp-row--active" href="${h}" data-kurssi="${o(r.key)}" aria-label="Kurssi ${a}: ${e}, ${c} / ${s} oppituntia">
      <span class="lp-row__num num">${a}</span>
      ${t}
      <span class="lp-row__status">
        <span class="pill" style="background:var(--brick);color:var(--brick-ink)"><span class="num">${c} / ${s}</span> oppituntia</span>
        ${d("chevron-right",'style="color:var(--brick)"')}
      </span>
    </a>`}function E(r,a,n){let u=a.filter(s=>s.kertausPassed).length,i=a.length,l=C(r),c=n?`
    <div class="lp-buy-banner" role="region" aria-label="Kurssin hankinta">
      <div class="lp-buy-banner__text">
        <strong>Koko polku avautuu Kurssilla.</strong>
        Kaikki 8 kurssia, adaptiivinen harjoittelu ja YO-valmius-mittari.
      </div>
      <button class="lp-buy-banner__btn btn btn--primary btn--sm" type="button" data-lp-buy="banner">
        Avaa Kurssi
      </button>
    </div>`:"";return`
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="here" aria-current="page">Oppimispolku</span>
    </nav>
    <div class="lp-head">
      <div>
        <span class="eyebrow">${o(l)} \xB7 YO-koevalmennus</span>
        <h1>Oppimispolku</h1>
        <p class="sub">${i} kurssia \xB7 ${u} suoritettu \xB7 Etene j\xE4rjestyksess\xE4.</p>
      </div>
      ${x}
    </div>
    ${c}
    <div class="lp-list">
      ${a.map((s,e)=>K(s,e+1,r,n)).join("")}
    </div>`}function S(r,a){r.innerHTML=`
    <nav class="crumbs" aria-label="Sijainti"><a href="#/aloitus">Aloitus</a></nav>
    <div class="op-error" role="alert">
      <p>${o(a||"Kursseja ei l\xF6ytynyt.")}</p>
      <a class="btn btn--primary btn--sm" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function M(r){y("screen-oppimispolku-index");let a=document.getElementById("op-root");if(!a)return;let n=r||j();a.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kursseja"><span class="sr-only">Ladataan kursseja\u2026</span></div>';let u=await $(n);if(u.length===0){S(a,"Kursseja ei viel\xE4 julkaistu t\xE4lle kielelle.");return}if(!window._userProfile)try{let s=await f();s?.profile&&!window._userProfile&&(window._userProfile=s.profile)}catch{}let i=m(),l=i!=="kurssi",c=i==="treeni"?"upgrade":"feature";if(a.innerHTML=E(n,u,l),l){a.querySelectorAll(".lp-row--buy-locked").forEach(e=>{let p=t=>{t.preventDefault(),k({variant:c,reason:"oppimispolku"})};e.addEventListener("click",p),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),p(t))})});let s=a.querySelector("[data-lp-buy='banner']");s&&s.addEventListener("click",()=>{k({variant:c,reason:"oppimispolku-banner"})})}a.querySelectorAll("a.lp-row").forEach(s=>{let e=s.dataset.kurssi;e&&b(s,()=>{w("courseDetail",()=>import("./app-courseDetail-CLL3JD37.js")),g(n,e)})})}function T(r){return/^#\/oppimispolku(\?|$)/.test(r||"")?(M(),!0):!1}export{M as loadOppimispolkuIndex,T as tryRouteOppimispolkuIndex};
//# sourceMappingURL=app-oppimispolkuIndex-QK2TT3K5.js.map
