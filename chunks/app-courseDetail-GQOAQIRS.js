import{a as b,c as f,e as $,j as h}from"./app-chunk-NZWTLFMY.js";import{b as v}from"./app-chunk-3WC2U67L.js";var w=new Map;function i(s){return String(s??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function C(s,e){let t=`${s}/${e}`,o=w.get(t);if(o&&Date.now()-o.ts<6e4)return o;try{let[a,p]=await Promise.all([h(`${b}/api/curriculum?lang=${encodeURIComponent(s)}`,{headers:{...f()?$():{}}}),h(`${b}/api/curriculum/${encodeURIComponent(e)}`,{headers:{...f()?$():{}}})]),r=a.ok?await a.json():null,l=p.ok?await p.json():null,c=Array.isArray(r?.kurssit)?r.kurssit:[],n=c.findIndex(d=>d.key===e)+1,u=c.find(d=>d.key===e)||null,m=Array.isArray(l?.lessons)?l.lessons.slice().sort((d,g)=>(d.sortOrder||0)-(g.sortOrder||0)):[];u&&(u._stepNumber=n);let y={ts:Date.now(),kurssi:u,lessons:m};return w.set(t,y),y}catch{return{ts:Date.now(),kurssi:null,lessons:[]}}}function L(s){return{vocab:"Sanasto",grammar:"Kielioppi",mixed:"Yhdistelm\xE4",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",exam:"Kertaustesti"}[s]||"Oppitunti"}function R(s,e,t,o){let a=s.sortOrder||0,p=!!s.completed,r=L(s.type),l=s.focus||s.title||`Oppitunti ${a}`,c=["op-row","is-clickable",p?"is-done":a===k?"is-progress":""].filter(Boolean).join(" "),n=p?"Suoritettu":"Aloita \u2192",u=Number(s.estimated_minutes)||14,m=`#/oppitunti/${e}/${encodeURIComponent(t)}/${a}`;return`
    <a class="${c}" href="${m}" data-lesson="${a}">
      <span class="op-row__num">${o}.${a}</span>
      <div class="op-row__body">
        <p class="op-row__type">${i(r)}</p>
        <h3 class="op-row__title">${i(l)}</h3>
      </div>
      <div class="op-row__meta">
        <span class="op-row__minutes">~${u} min</span>
        <span class="op-row__status">${i(n)}</span>
      </div>
    </a>`}var k=null;function I(s,e,t){let o=e?._stepNumber||1,a=t.length,p=t.filter(n=>n.completed).length,r=a>0?Math.round(p/a*100):0,l=t.find(n=>!n.completed);k=l?l.sortOrder:null;let c=s==="es"?"Espanja":s==="fr"?"Ranska":s==="de"?"Saksa":s;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(s)}">Oppimispolku</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">${i(`Kurssi ${o}`)}</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${i(c)} \xB7 Kurssi ${o} \xB7 Taso ${i(e?.level||"\u2014")}</p>
      <h1 class="op-title display display--serif">${i(e?.title||"Kurssi")}</h1>
      ${e?.description?`<p class="op-sub">${i(e.description)}</p>`:""}
      <div class="op-progress">
        <div class="op-progress-bar" role="progressbar" aria-valuenow="${r}" aria-valuemin="0" aria-valuemax="100" aria-label="${r} % suoritettu">
          <div class="op-progress-fill" style="width:${r}%"></div>
        </div>
        <span class="op-progress-text mono-num">${p} / ${a} oppituntia \xB7 ${r} %</span>
      </div>
    </header>
    <ol class="op-list" role="list">
      ${t.map(n=>R(n,s,e?.key||"",o)).join("")}
    </ol>`}function _(s,e,t){s.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${i(e||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Palaa kurssilistaan</a>
    </div>`}async function j(s,e){v("screen-course-detail");let t=document.getElementById("cd-root");if(!t)return;if(t.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kurssia"><span class="sr-only">Ladataan kurssia\u2026</span></div>',!s||!e){_(t,"Kurssin tunnistetta ei annettu.",s);return}let{kurssi:o,lessons:a}=await C(s,e);if(!o){_(t,"Kurssia ei l\xF6ytynyt.",s);return}if(a.length===0){_(t,"Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.",s);return}t.innerHTML=I(s,o,a)}function x(s){let e=/^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(s||"");if(!e)return!1;let t=e[1].toLowerCase(),o=decodeURIComponent(e[2]);return j(t,o),!0}export{j as loadCourseDetail,x as tryRouteCourseDetail};
//# sourceMappingURL=app-courseDetail-GQOAQIRS.js.map
