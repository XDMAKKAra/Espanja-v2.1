import{b as m}from"./app-chunk-P4RMEY33.js";import"./app-chunk-ECRDZOTG.js";import{b as d}from"./app-chunk-3WC2U67L.js";function r(e){return String(e??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}function $(e){return{vocab:"Sanasto",grammar:"Kielioppi",mixed:"Yhdistelm\xE4",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",exam:"Kertaustesti"}[e]||"Oppitunti"}function h(e,s,a,o){let t=e.sortOrder||0,p=!!e.completed,i=$(e.type),l=e.focus||e.title||`Oppitunti ${t}`,u=["op-row","is-clickable",p?"is-done":t===b?"is-progress":""].filter(Boolean).join(" "),n=p?"Suoritettu":"Aloita \u2192",f=Number(e.estimated_minutes)||14,_=`#/oppitunti/${s}/${encodeURIComponent(a)}/${t}`;return`
    <a class="${u}" href="${_}" data-lesson="${t}">
      <span class="op-row__num">${o}.${t}</span>
      <div class="op-row__body">
        <p class="op-row__type">${r(i)}</p>
        <h3 class="op-row__title">${r(l)}</h3>
      </div>
      <div class="op-row__meta">
        <span class="op-row__minutes">~${f} min</span>
        <span class="op-row__status">${r(n)}</span>
      </div>
    </a>`}var b=null;function v(e,s,a){let o=s?._stepNumber||1,t=a.length,p=a.filter(n=>n.completed).length,i=t>0?Math.round(p/t*100):0,l=a.find(n=>!n.completed);b=l?l.sortOrder:null;let u=e==="es"?"Espanja":e==="fr"?"Ranska":e==="de"?"Saksa":e;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(e)}">Oppimispolku</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">${r(`Kurssi ${o}`)}</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${r(u)} \xB7 Kurssi ${o} \xB7 Taso ${r(s?.level||"\u2014")}</p>
      <h1 class="op-title display display--serif">${r(s?.title||"Kurssi")}</h1>
      ${s?.description?`<p class="op-sub">${r(s.description)}</p>`:""}
      <div class="op-progress">
        <div class="op-progress-bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="100" aria-label="${i} % suoritettu">
          <div class="op-progress-fill" style="width:${i}%"></div>
        </div>
        <span class="op-progress-text mono-num">${p} / ${t} oppituntia \xB7 ${i} %</span>
      </div>
    </header>
    <ol class="op-list" role="list">
      ${a.map(n=>h(n,e,s?.key||"",o)).join("")}
    </ol>`}function c(e,s,a){e.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(a||"es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${r(s||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/oppimispolku?lang=${encodeURIComponent(a||"es")}">Palaa kurssilistaan</a>
    </div>`}async function y(e,s){d("screen-course-detail");let a=document.getElementById("cd-root");if(!a)return;if(a.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kurssia"><span class="sr-only">Ladataan kurssia\u2026</span></div>',!e||!s){c(a,"Kurssin tunnistetta ei annettu.",e);return}let{kurssi:o,lessons:t}=await m(e,s);if(!o){c(a,"Kurssia ei l\xF6ytynyt.",e);return}if(t.length===0){c(a,"Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.",e);return}a.innerHTML=v(e,o,t)}function g(e){let s=/^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(e||"");if(!s)return!1;let a=s[1].toLowerCase(),o=decodeURIComponent(s[2]);return y(a,o),!0}export{y as loadCourseDetail,g as tryRouteCourseDetail};
//# sourceMappingURL=app-courseDetail-75WJ7AL2.js.map
