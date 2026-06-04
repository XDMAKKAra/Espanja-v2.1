import{b as h}from"./app-chunk-LF22L46I.js";import"./app-chunk-T52YLBP4.js";import{b as m}from"./app-chunk-PXMVMW5B.js";var w={"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',"arrow-right":'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'};function $(s,e=""){return`<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${e}>${w[s]||""}</svg>`}function r(s){return String(s??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function g(s){return{vocab:"Sanasto",grammar:"Kielioppi",mixed:"Yhdistelm\xE4",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",exam:"Kertaustesti",test:"Kertaustesti"}[s]||"Oppitunti"}function k(s){return s==="es"?"Espanja":s==="fr"?"Ranska":s==="de"?"Saksa":s}function C(s,e,t,n,a){let o=s.sortOrder||0,c=!!s.completed,l=!c&&a,p=!c&&!l,u=g(s.type),i=r(s.focus||s.title||`Oppitunti ${o}`),f=Number(s.estimated_minutes)||14,v=`#/oppitunti/${e}/${encodeURIComponent(t)}/${o}`,b="lesson-row"+(l?" lesson-row--active":"")+(p?" lesson-row--upcoming":""),y=c?`<span class="lesson-done">${$("circle-check")} Suoritettu</span>`:`<a class="btn ${l?"btn--primary":"btn--ghost"} btn--sm" href="${v}">Aloita ${$("arrow-right",'style="width:15px;height:15px"')}</a>`;return`
    <div class="${b}">
      <span class="lesson-row__num">${n}.${o}</span>
      <div>
        <span class="eyebrow" style="font-size:11px">${r(u)}</span>
        <div class="lesson-row__title">${i}</div>
      </div>
      <div class="lesson-row__right">
        <span class="lesson-row__time">~${f} min</span>
        ${y}
      </div>
    </div>`}function L(s,e,t){let n=e?._stepNumber||1,a=t.length,o=t.filter(i=>i.completed).length,c=a>0?Math.round(o/a*100):0,l=t.find(i=>!i.completed),p=l?l.sortOrder:null,u=k(s);return`
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <a href="#/oppimispolku?lang=${encodeURIComponent(s)}">Oppimispolku</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="here" aria-current="page">${r(`Kurssi ${n}`)}</span>
    </nav>
    <div class="cd-head">
      <span class="eyebrow">${r(u)} \xB7 Kurssi ${n} \xB7 Taso ${r(e?.level||"\u2014")}</span>
      <h1>${r(e?.title||"Kurssi")}</h1>
      ${e?.description?`<p class="desc">${r(e.description)}</p>`:""}
      <div class="cd-progress">
        <span class="label num">${o} / ${a} oppituntia \xB7 ${c} %</span>
        <span class="bar"><span style="width:${c}%"></span></span>
      </div>
    </div>
    <div class="lesson-list">
      ${t.map(i=>C(i,s,e?.key||"",n,i.sortOrder===p)).join("")}
    </div>`}function d(s,e,t){s.innerHTML=`
    <nav class="crumbs" aria-label="Sijainti">
      <a href="#/aloitus">Aloitus</a>
      <span class="sep" aria-hidden="true">/</span>
      <a href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${r(e||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn btn--primary btn--sm" href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Palaa kurssilistaan</a>
    </div>`}async function x(s,e){m("screen-course-detail");let t=document.getElementById("cd-root");if(!t)return;if(t.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kurssia"><span class="sr-only">Ladataan kurssia\u2026</span></div>',!s||!e){d(t,"Kurssin tunnistetta ei annettu.",s);return}let{kurssi:n,lessons:a}=await h(s,e);if(!n){d(t,"Kurssia ei l\xF6ytynyt.",s);return}if(a.length===0){d(t,"Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.",s);return}t.innerHTML=L(s,n,a)}function j(s){let e=/^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(s||"");if(!e)return!1;let t=e[1].toLowerCase(),n=decodeURIComponent(e[2]);return x(t,n),!0}export{x as loadCourseDetail,j as tryRouteCourseDetail};
//# sourceMappingURL=app-courseDetail-5VLYUAO5.js.map
