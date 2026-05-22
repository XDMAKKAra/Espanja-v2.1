import{a as c,b as u}from"./app-chunk-7KFQ2POU.js";import{a as d,d as m}from"./app-chunk-P4RMEY33.js";import"./app-chunk-ECRDZOTG.js";import{b as p}from"./app-chunk-3WC2U67L.js";function i(e){return String(e??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}function k(){let e=/lang=([a-z]{2})/i.exec(location.hash||"");if(e)return e[1].toLowerCase();try{return localStorage.getItem("puheo:lang")||"es"}catch{return"es"}}function v(e,s,t){let r=!!e.kertausPassed,o=!e.isUnlocked,a=e.lessonsCompleted||0,l=e.lessonCount||10,n=Math.min(100,Math.round(a/l*100)),f=r?"Suoritettu":o?"Lukittu":a>0?`${a} / ${l} oppituntia`:"Aloita \u2192",h=["op-row",r?"is-done":"",o?"is-locked":"is-clickable",a>0&&!r?"is-progress":""].filter(Boolean).join(" "),b=o?"#":`#/oppimispolku/${t}/${encodeURIComponent(e.key)}`;return`
    <a class="${h}" href="${b}" data-kurssi="${i(e.key)}" ${o?'aria-disabled="true"':""}>
      <span class="op-row__num">${s}</span>
      <div class="op-row__body">
        <h3 class="op-row__title">${i(e.title)}</h3>
        ${e.description?`<p class="op-row__desc">${i(e.description)}</p>`:""}
      </div>
      <div class="op-row__meta">
        <div class="op-row__progress" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100" aria-label="${n} % suoritettu">
          <div class="op-row__progress-fill" style="width:${n}%"></div>
        </div>
        <span class="op-row__status">${i(f)}</span>
      </div>
    </a>`}function _(e,s){let t=s.filter(a=>a.kertausPassed).length,r=s.length;return`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="op-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="op-breadcrumb__crumb is-current" aria-current="page">Oppimispolku</span>
    </nav>
    <header class="op-head">
      <p class="op-eyebrow">${i(e==="es"?"Espanja":e==="fr"?"Ranska":e==="de"?"Saksa":e)} \xB7 YO-koevalmennus</p>
      <h1 class="op-title display display--serif">Oppimispolku</h1>
      <p class="op-sub">${r} kurssia \xB7 ${t} suoritettu \xB7 Etene j\xE4rjestyksess\xE4.</p>
    </header>
    <ol class="op-list" role="list">
      ${s.map((a,l)=>v(a,l+1,e)).join("")}
    </ol>`}function $(e,s){e.innerHTML=`
    <nav class="op-breadcrumb" aria-label="Sijainti">
      <a class="op-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="op-error" role="alert">
      <p>${i(s||"Kursseja ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function y(e){p("screen-oppimispolku-index");let s=document.getElementById("op-root");if(!s)return;let t=e||k();s.innerHTML='<div class="op-loading" role="status" aria-label="Ladataan kursseja"><span class="sr-only">Ladataan kursseja\u2026</span></div>';let r=await d(t);if(r.length===0){$(s,"Kursseja ei viel\xE4 julkaistu t\xE4lle kielelle.");return}s.innerHTML=_(t,r),s.querySelectorAll(".op-row.is-locked").forEach(o=>{o.addEventListener("click",a=>a.preventDefault())}),s.querySelectorAll(".op-row.is-clickable").forEach(o=>{let a=o.dataset.kurssi;a&&u(o,()=>{c("courseDetail",()=>import("./app-courseDetail-75WJ7AL2.js")),m(t,a)})})}function j(e){return/^#\/oppimispolku(\?|$)/.test(e||"")?(y(),!0):!1}export{y as loadOppimispolkuIndex,j as tryRouteOppimispolkuIndex};
//# sourceMappingURL=app-oppimispolkuIndex-DJIA5V5Q.js.map
