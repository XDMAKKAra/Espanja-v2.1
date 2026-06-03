import{a as u,b as d}from"./app-chunk-7KFQ2POU.js";import{a as m,d as h}from"./app-chunk-APZT2EDY.js";import"./app-chunk-T52YLBP4.js";import{b as c}from"./app-chunk-PXMVMW5B.js";function t(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function _(){let e=/lang=([a-z]{2})/i.exec(location.hash||"");if(e)return e[1].toLowerCase();try{return localStorage.getItem("puheo:lang")||"es"}catch{return"es"}}function b(e,a,i){let o=!!e.kertausPassed,r=!e.isUnlocked,s=e.lessonsCompleted||0,l=e.lessonCount||10,n=Math.min(100,Math.round(s/l*100)),p=o?"Suoritettu":r?"Avautuu vuorollaan":s>0?`${s} / ${l} oppituntia`:"Aloita \u2192",f=["op-row",o?"is-done":"",r?"is-locked":"is-clickable",s>0&&!o?"is-progress":""].filter(Boolean).join(" "),v=r?"#":`#/oppimispolku/${i}/${encodeURIComponent(e.key)}`;return`
    <li class="op-row-li">
      <a class="${f}" href="${v}" data-kurssi="${t(e.key)}" ${r?'aria-disabled="true"':""} aria-label="Kurssi ${a}: ${t(e.title)}, ${t(p)}">
        <span class="op-row__num" aria-hidden="true">${a}</span>
        <div class="op-row__body">
          <h2 class="op-row__title">${t(e.title)}</h2>
          ${e.description?`<p class="op-row__desc">${t(e.description)}</p>`:""}
        </div>
        <div class="op-row__meta">
          <div class="op-row__progress" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100" aria-label="${n} % suoritettu">
            <div class="op-row__progress-fill" style="width:${n}%"></div>
          </div>
          <span class="op-row__status">${t(p)}</span>
        </div>
      </a>
    </li>`}function $(e,a){let i=a.filter(s=>s.kertausPassed).length,o=a.length;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">Oppimispolku</span>
    </nav>
    <header class="op-head">
      <div class="op-head__text">
        <p class="op-eyebrow">${t(e==="es"?"Espanja":e==="fr"?"Ranska":e==="de"?"Saksa":e)} \xB7 YO-koevalmennus</p>
        <h1 class="op-title display display--serif">Oppimispolku</h1>
        <p class="op-sub">${o} kurssia \xB7 ${i} suoritettu \xB7 Etene j\xE4rjestyksess\xE4.</p>
      </div>
      <img class="op-head__art" src="/img/illustrations/path-journey.svg" alt="" aria-hidden="true" width="260" height="200" loading="lazy" />
    </header>
    <ol class="op-list">
      ${a.map((s,l)=>b(s,l+1,e)).join("")}
    </ol>`}function k(e,a){e.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${t(a||"Kursseja ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function g(e){c("screen-oppimispolku-index");let a=document.getElementById("op-root");if(!a)return;let i=e||_();a.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kursseja"><span class="sr-only">Ladataan kursseja\u2026</span></div>';let o=await m(i);if(o.length===0){k(a,"Kursseja ei viel\xE4 julkaistu t\xE4lle kielelle.");return}a.innerHTML=$(i,o),a.querySelectorAll(".op-row.is-locked").forEach(r=>{r.addEventListener("click",s=>s.preventDefault())}),a.querySelectorAll(".op-row.is-clickable").forEach(r=>{let s=r.dataset.kurssi;s&&d(r,()=>{u("courseDetail",()=>import("./app-courseDetail-YCUVMJDC.js")),h(i,s)})})}function L(e){return/^#\/oppimispolku(\?|$)/.test(e||"")?(g(),!0):!1}export{g as loadOppimispolkuIndex,L as tryRouteOppimispolkuIndex};
//# sourceMappingURL=app-oppimispolkuIndex-T3Y2Q2H5.js.map
