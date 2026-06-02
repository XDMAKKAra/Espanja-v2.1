import{b as m}from"./app-chunk-IRK4MNR4.js";import"./app-chunk-L2TORAU4.js";import{b as d}from"./app-chunk-PXMVMW5B.js";function r(s){return String(s??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function $(s){return{vocab:"Sanasto",grammar:"Kielioppi",mixed:"Yhdistelm\xE4",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",exam:"Kertaustesti"}[s]||"Oppitunti"}function h(s,e,a,o){let t=s.sortOrder||0,p=!!s.completed,n=$(s.type),l=s.focus||s.title||`Oppitunti ${t}`,c=["op-row","is-clickable",p?"is-done":t===b?"is-progress":""].filter(Boolean).join(" "),i=p?"Suoritettu":"Aloita \u2192",f=Number(s.estimated_minutes)||14,_=`#/oppitunti/${e}/${encodeURIComponent(a)}/${t}`;return`
    <li class="op-row-li">
      <a class="${c}" href="${_}" data-lesson="${t}">
        <span class="op-row__num">${o}.${t}</span>
        <div class="op-row__body">
          <p class="op-row__type">${r(n)}</p>
          <h2 class="op-row__title">${r(l)}</h2>
        </div>
        <div class="op-row__meta">
          <span class="op-row__minutes">~${f} min</span>
          <span class="op-row__status">${r(i)}</span>
        </div>
      </a>
    </li>`}var b=null;function v(s,e,a){let o=e?._stepNumber||1,t=a.length,p=a.filter(i=>i.completed).length,n=t>0?Math.round(p/t*100):0,l=a.find(i=>!i.completed);b=l?l.sortOrder:null;let c=s==="es"?"Espanja":s==="fr"?"Ranska":s==="de"?"Saksa":s;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(s)}">Oppimispolku</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">${r(`Kurssi ${o}`)}</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${r(c)} \xB7 Kurssi ${o} \xB7 Taso ${r(e?.level||"\u2014")}</p>
      <h1 class="op-title display display--serif">${r(e?.title||"Kurssi")}</h1>
      ${e?.description?`<p class="op-sub">${r(e.description)}</p>`:""}
      <div class="op-progress">
        <div class="op-progress-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100" aria-label="${n} % suoritettu">
          <div class="op-progress-fill" style="width:${n}%"></div>
        </div>
        <span class="op-progress-text mono-num">${p} / ${t} oppituntia \xB7 ${n} %</span>
      </div>
    </header>
    <ol class="op-list">
      ${a.map(i=>h(i,s,e?.key||"",o)).join("")}
    </ol>`}function u(s,e,a){s.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(a||"es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${r(e||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/oppimispolku?lang=${encodeURIComponent(a||"es")}">Palaa kurssilistaan</a>
    </div>`}async function y(s,e){d("screen-course-detail");let a=document.getElementById("cd-root");if(!a)return;if(a.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kurssia"><span class="sr-only">Ladataan kurssia\u2026</span></div>',!s||!e){u(a,"Kurssin tunnistetta ei annettu.",s);return}let{kurssi:o,lessons:t}=await m(s,e);if(!o){u(a,"Kurssia ei l\xF6ytynyt.",s);return}if(t.length===0){u(a,"Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.",s);return}a.innerHTML=v(s,o,t)}function g(s){let e=/^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(s||"");if(!e)return!1;let a=e[1].toLowerCase(),o=decodeURIComponent(e[2]);return y(a,o),!0}export{y as loadCourseDetail,g as tryRouteCourseDetail};
//# sourceMappingURL=app-courseDetail-F3EIAQST.js.map
