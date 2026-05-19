import{a as b,c as f,e as $,j as h}from"./app-chunk-NZWTLFMY.js";import{b as v}from"./app-chunk-3WC2U67L.js";var w=new Map;function i(e){return String(e??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}async function C(e,s){let t=`${e}/${s}`,o=w.get(t);if(o&&Date.now()-o.ts<6e4)return o;try{let[a,p]=await Promise.all([h(`${b}/api/curriculum?lang=${encodeURIComponent(e)}`,{headers:{...f()?$():{}}}),h(`${b}/api/curriculum/${encodeURIComponent(s)}`,{headers:{...f()?$():{}}})]),r=a.ok?await a.json():null,l=p.ok?await p.json():null,c=Array.isArray(r?.kurssit)?r.kurssit:[],n=c.findIndex(d=>d.key===s)+1,u=c.find(d=>d.key===s)||null,m=Array.isArray(l?.lessons)?l.lessons.slice().sort((d,g)=>(d.sortOrder||0)-(g.sortOrder||0)):[];u&&(u._stepNumber=n);let y={ts:Date.now(),kurssi:u,lessons:m};return w.set(t,y),y}catch{return{ts:Date.now(),kurssi:null,lessons:[]}}}function R(e){return{vocab:"Sanasto",grammar:"Kielioppi",mixed:"Yhdistelm\xE4",reading:"Luetun ymm\xE4rt\xE4minen",writing:"Kirjoittaminen",exam:"Kertaustesti"}[e]||"Oppitunti"}function I(e,s,t,o){let a=e.sortOrder||0,p=!!e.completed,r=R(e.type),l=e.focus||e.title||`Oppitunti ${a}`,c=["op-row","is-clickable",p?"is-done":a===k?"is-progress":""].filter(Boolean).join(" "),n=p?"Suoritettu":"Aloita \u2192",u=Number(e.estimated_minutes)||14,m=`#/oppitunti/${s}/${encodeURIComponent(t)}/${a}`;return`
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
    </a>`}var k=null;function L(e,s,t){let o=s?._stepNumber||1,a=t.length,p=t.filter(n=>n.completed).length,r=a>0?Math.round(p/a*100):0,l=t.find(n=>!n.completed);k=l?l.sortOrder:null;let c=e==="es"?"Espanja":e==="fr"?"Ranska":e==="de"?"Saksa":e;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(e)}">Oppimispolku</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">${i(`Kurssi ${o}`)}</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${i(c)} \xB7 Kurssi ${o} \xB7 Taso ${i(s?.level||"\u2014")}</p>
      <h1 class="op-title display display--serif">${i(s?.title||"Kurssi")}</h1>
      ${s?.description?`<p class="op-sub">${i(s.description)}</p>`:""}
      <div class="op-progress">
        <div class="op-progress-bar" role="progressbar" aria-valuenow="${r}" aria-valuemin="0" aria-valuemax="100" aria-label="${r} % suoritettu">
          <div class="op-progress-fill" style="width:${r}%"></div>
        </div>
        <span class="op-progress-text mono-num">${p} / ${a} oppituntia \xB7 ${r} %</span>
      </div>
    </header>
    <ol class="op-list" role="list">
      ${t.map(n=>I(n,e,s?.key||"",o)).join("")}
    </ol>`}function _(e,s,t){e.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <a class="op-breadcrumb__link" href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Oppimispolku</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${i(s||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/oppimispolku?lang=${encodeURIComponent(t||"es")}">Palaa kurssilistaan</a>
    </div>`}async function j(e,s){v("screen-course-detail");let t=document.getElementById("cd-root");if(!t)return;if(t.innerHTML='<p class="op-loading">Ladataan kurssia\u2026</p>',!e||!s){_(t,"Kurssin tunnistetta ei annettu.",e);return}let{kurssi:o,lessons:a}=await C(e,s);if(!o){_(t,"Kurssia ei l\xF6ytynyt.",e);return}if(a.length===0){_(t,"Oppitunteja ei viel\xE4 julkaistu t\xE4lle kurssille.",e);return}t.innerHTML=L(e,o,a)}function x(e){let s=/^#\/oppimispolku\/([a-z]{2})\/([^/?#]+)/i.exec(e||"");if(!s)return!1;let t=s[1].toLowerCase(),o=decodeURIComponent(s[2]);return j(t,o),!0}export{j as loadCourseDetail,x as tryRouteCourseDetail};
//# sourceMappingURL=app-courseDetail-ZKPWOIR7.js.map
