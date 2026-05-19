import{a as d,c as u,e as h,j as m}from"./app-chunk-NZWTLFMY.js";import{b as p}from"./app-chunk-3WC2U67L.js";var f=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],v="puheo:lang",g=new Map;function L(){try{let e=localStorage.getItem(v);if(e&&f.some(a=>a.code===e))return e}catch{}return"es"}function y(e){try{localStorage.setItem(v,e)}catch{}}function n(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function w(e){return`
    <header class="home-head">
      <p class="home-eyebrow">Aloita harjoittelu</p>
      <h1 class="home-title display display--serif">YO-koevalmennus</h1>
      <p class="home-sub">Valitse kieli ja kurssi. Edistyminen tallentuu jokaiseen erikseen.</p>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${f.map(t=>`
    <button type="button"
            class="home-tab ${t.code===e?"is-active":""}"
            data-lang="${t.code}"
            role="tab"
            aria-selected="${t.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${t.flag}</span>
      <span class="home-tab__label">${n(t.label)}</span>
    </button>
  `).join("")}</div>
    <div class="home-grid" id="home-grid" aria-live="polite">
      <div class="home-grid-loading">Ladataan kursseja&hellip;</div>
    </div>`}function A(e,a,t){let s=!!a.kertausPassed,o=!a.isUnlocked,r=a.lessonsCompleted||0,i=a.lessonCount||10,l=Math.min(100,Math.round(r/i*100)),b=s?"Suoritettu":o?"Lukittu":r>0?"Jatka":"Aloita",k=s?"is-done":o?"is-locked":r>0?"is-progress":"is-start",c=t*47%360,$=(c+28)%360;return`
    <button type="button"
            class="home-card ${k}"
            data-kurssi="${n(a.key)}"
            data-lang="${n(e)}"
            ${o?'aria-disabled="true"':""}>
      <div class="home-card__cover"
           style="background: linear-gradient(135deg, oklch(72% 0.08 ${c}) 0%, oklch(58% 0.10 ${$}) 100%);">
        <span class="home-card__cover-num">${t}</span>
        <span class="home-card__cover-level">Taso ${n(a.level||"\u2014")}</span>
      </div>
      <div class="home-card__body">
        <h3 class="home-card__title">${n(`${t}. ${a.title}`)}</h3>
        <div class="home-card__progress" role="progressbar" aria-valuenow="${l}" aria-valuemin="0" aria-valuemax="100" aria-label="${l} % suoritettu">
          <div class="home-card__progress-bar"><div class="home-card__progress-fill" style="width:${l}%"></div></div>
          <span class="home-card__progress-text">${r} / ${i} oppituntia</span>
        </div>
        <span class="home-card__status">${n(b)}</span>
      </div>
    </button>`}function E(e,a,t){if(!t||t.length===0){e.innerHTML='<p class="home-grid-empty">Kursseja ei viel&auml; julkaistu t&auml;lle kielelle.</p>';return}e.innerHTML=t.map((s,o)=>A(a,s,o+1)).join(""),e.querySelectorAll(".home-card:not([aria-disabled='true'])").forEach(s=>{s.addEventListener("click",async()=>{let o=s.dataset.kurssi,r=s.dataset.lang;y(r);try{let i=await import("./app-curriculum-OPY6DZV3.js");i._setExpandedKurssi&&i._setExpandedKurssi(o),location.hash="#/oppimispolku",i.loadCurriculum&&i.loadCurriculum()}catch{location.hash="#/oppimispolku"}})})}async function j(e){let a=g.get(e);if(a&&Date.now()-a.ts<6e4)return a.kurssit;try{let t=await m(`${d}/api/curriculum?lang=${encodeURIComponent(e)}`,{headers:{...u()?h():{}}});if(!t.ok)return[];let s=await t.json();if(s?.available===!1)return[];let o=Array.isArray(s?.kurssit)?s.kurssit.filter(r=>r&&typeof r.key=="string"):[];return g.set(e,{ts:Date.now(),kurssit:o}),o}catch{return[]}}async function _(e){let a=document.getElementById("home-grid");if(!a)return;let t=await j(e);E(a,e,t)}function C(e){e.querySelectorAll(".home-tab").forEach(a=>{a.addEventListener("click",async()=>{let t=a.dataset.lang;if(!t)return;y(t),e.querySelectorAll(".home-tab").forEach(o=>{let r=o===a;o.classList.toggle("is-active",r),o.setAttribute("aria-selected",r?"true":"false")});let s=document.getElementById("home-grid");s&&(s.innerHTML='<div class="home-grid-loading">Ladataan kursseja&hellip;</div>'),await _(t)})})}async function I(){p("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=L();e.innerHTML=w(a),C(e),await _(a)}export{I as loadHome};
//# sourceMappingURL=app-home-JLLSROQT.js.map
