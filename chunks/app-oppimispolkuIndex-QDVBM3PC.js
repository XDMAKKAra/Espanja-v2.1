import{a as c,c as p,e as u,j as d}from"./app-chunk-NZWTLFMY.js";import{b as m}from"./app-chunk-3WC2U67L.js";var f=new Map;function n(e){return String(e??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}function _(){let e=/lang=([a-z]{2})/i.exec(location.hash||"");if(e)return e[1].toLowerCase();try{return localStorage.getItem("puheo:lang")||"es"}catch{return"es"}}async function $(e){let s=f.get(e);if(s&&Date.now()-s.ts<6e4)return s.kurssit;try{let o=await d(`${c}/api/curriculum?lang=${encodeURIComponent(e)}`,{headers:{...p()?u():{}}});if(!o.ok)return[];let t=await o.json();if(t?.available===!1)return[];let r=Array.isArray(t?.kurssit)?t.kurssit.filter(a=>a&&typeof a.key=="string"):[];return f.set(e,{ts:Date.now(),kurssit:r}),r}catch{return[]}}function v(e,s,o){let t=!!e.kertausPassed,r=!e.isUnlocked,a=e.lessonsCompleted||0,i=e.lessonCount||10,l=Math.min(100,Math.round(a/i*100)),h=t?"Suoritettu":r?"Lukittu":a>0?`${a} / ${i} oppituntia`:"Aloita \u2192",b=["op-row",t?"is-done":"",r?"is-locked":"is-clickable",a>0&&!t?"is-progress":""].filter(Boolean).join(" "),k=r?"#":`#/oppimispolku/${o}/${encodeURIComponent(e.key)}`;return`
    <a class="${b}" href="${k}" data-kurssi="${n(e.key)}" ${r?'aria-disabled="true"':""}>
      <span class="op-row__num">${s}</span>
      <div class="op-row__body">
        <h3 class="op-row__title">${n(e.title)}</h3>
        ${e.description?`<p class="op-row__desc">${n(e.description)}</p>`:""}
      </div>
      <div class="op-row__meta">
        <div class="op-row__progress" role="progressbar" aria-valuenow="${l}" aria-valuemin="0" aria-valuemax="100" aria-label="${l} % suoritettu">
          <div class="op-row__progress-fill" style="width:${l}%"></div>
        </div>
        <span class="op-row__status">${n(h)}</span>
      </div>
    </a>`}function y(e,s){let o=s.filter(a=>a.kertausPassed).length,t=s.length;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">Oppimispolku</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${n(e==="es"?"Espanja":e==="fr"?"Ranska":e==="de"?"Saksa":e)} \xB7 YO-koevalmennus</p>
      <h1 class="op-title display display--serif">Oppimispolku</h1>
      <p class="op-sub">${t} kurssia \xB7 ${o} suoritettu \xB7 Etene j\xE4rjestyksess\xE4.</p>
    </header>
    <ol class="op-list" role="list">
      ${s.map((a,i)=>v(a,i+1,e)).join("")}
    </ol>`}function w(e,s){e.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${n(s||"Kursseja ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function g(e){m("screen-oppimispolku-index");let s=document.getElementById("op-root");if(!s)return;let o=e||_();s.innerHTML='<p class="op-loading">Ladataan kursseja\u2026</p>';let t=await $(o);if(t.length===0){w(s,"Kursseja ei viel\xE4 julkaistu t\xE4lle kielelle.");return}s.innerHTML=y(o,t),s.querySelectorAll(".op-row.is-locked").forEach(r=>{r.addEventListener("click",a=>a.preventDefault())})}function I(e){return/^#\/oppimispolku(\?|$)/.test(e||"")?(g(),!0):!1}export{g as loadOppimispolkuIndex,I as tryRouteOppimispolkuIndex};
//# sourceMappingURL=app-oppimispolkuIndex-QDVBM3PC.js.map
