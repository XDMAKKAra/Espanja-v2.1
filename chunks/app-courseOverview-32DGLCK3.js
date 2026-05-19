import{a as u,c as d,e as p,j as h}from"./app-chunk-NZWTLFMY.js";import{b as m}from"./app-chunk-3WC2U67L.js";var _=new Map;function c(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function b(){let e=window._userProfile?.subscription_status||"";return["pro","treeni","lifetime","trialing","active"].some(t=>e.toLowerCase().includes(t))}async function f(e,t){let a=`${e}/${t}`,r=_.get(a);if(r&&Date.now()-r.ts<6e4)return r.kurssi;try{let o=await h(`${u}/api/curriculum?lang=${encodeURIComponent(e)}`,{headers:{...d()?p():{}}});if(!o.ok)return null;let i=await o.json(),n=Array.isArray(i?.kurssit)?i.kurssit:[],s=n.find(l=>l.key===t)||null;return s&&(s._stepNumber=n.findIndex(l=>l.key===t)+1,_.set(a,{ts:Date.now(),kurssi:s})),s}catch{return null}}var g=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssin sis\xE4lt\xF6 sanasto- ja kielioppiteht\xE4vineen.",icon:"\u{1F4DA}",gateForFree:!1,badge:{free:"Yksi oppitunti per p\xE4iv\xE4",pro:null},target:({lang:e,kurssiKey:t})=>`#/oppimispolku?lang=${e}&kurssi=${encodeURIComponent(t)}`},{id:"writing",title:"Kirjoitusteht\xE4v\xE4",body:"AI arvioi tuotoksen YTL-rubriikilla. Saat pisteet ja konkreettiset korjaukset.",icon:"\u270D\uFE0F",gateForFree:!1,badge:{free:"3 teht\xE4v\xE4\xE4 per kuukausi",pro:null},target:()=>"#/kirjoitus"},{id:"reading",title:"Luetun ymm\xE4rt\xE4minen",body:"Aitoja YO-tyylisi\xE4 tekstej\xE4 ja monivalintateht\xE4v\xE4t.",icon:"\u{1F4D6}",gateForFree:!1,badge:{free:"5 teksti\xE4 per p\xE4iv\xE4",pro:null},target:()=>"#/luetun"},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",icon:"\u{1F393}",gateForFree:!0,badge:{free:"Avaa Treeni",pro:null},target:()=>"#/koeharjoitus"}];function v(e,t){let a=e._stepNumber||1,r=e.lessonsCompleted||0,o=e.lessonCount||10,i=Math.min(100,Math.round(r/o*100)),n=a*47%360,s=(n+28)%360;return`
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="co-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="co-breadcrumb__crumb is-current" aria-current="page">${c(`Kurssi ${a}`)}</span>
    </nav>
    <header class="co-hero">
      <div class="co-hero__cover"
           style="background: linear-gradient(135deg, oklch(72% 0.08 ${n}) 0%, oklch(58% 0.10 ${s}) 100%);">
        <span class="co-hero__num">${a}</span>
      </div>
      <div class="co-hero__body">
        <p class="co-hero__eyebrow">${c(`Kurssi ${a}`)} &middot; Taso ${c(e.level||"\u2014")}</p>
        <h1 class="co-hero__title display display--serif">${c(e.title||"")}</h1>
        ${e.description?`<p class="co-hero__desc">${c(e.description)}</p>`:""}
        <div class="co-hero__progress">
          <div class="co-hero__progress-bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="100" aria-label="${i} % suoritettu">
            <div class="co-hero__progress-fill" style="width:${i}%"></div>
          </div>
          <span class="co-hero__progress-text mono-num">${r} / ${o} oppituntia &middot; ${i} %</span>
        </div>
      </div>
    </header>`}function y(e,t,a){let r=a?e.badge.pro:e.badge.free,o=!a&&e.gateForFree,i=["co-mode",`co-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),n=e.target(t);return`
    <a class="${i}" href="${n}" data-mode="${e.id}" ${o?'aria-disabled="true"':""}>
      <span class="co-mode__icon" aria-hidden="true">${e.icon}</span>
      <div class="co-mode__body">
        <h3 class="co-mode__title">${c(e.title)}</h3>
        <p class="co-mode__desc">${e.body}</p>
      </div>
      ${r?`<span class="co-mode__badge ${o?"is-lock":""}">${o?"\u{1F512} ":""}${r}</span>`:""}
    </a>`}function $(e){return e?"":`
    <aside class="co-upgrade">
      <p class="co-upgrade__eyebrow">Treeni</p>
      <h4 class="co-upgrade__title">Avaa kaikki harjoitukset.</h4>
      <p class="co-upgrade__body">Treeni-tilauksella saat rajoittamattoman p\xE4\xE4syn jokaiseen kurssiin, koeharjoituksiin ja kirjoitusteht\xE4v\xE4n AI-arvioon.</p>
      <button type="button" class="co-upgrade__cta" id="co-upgrade-cta">Tutustu Treeniin \u2192</button>
    </aside>`}function j(e,t){let a=b(),r={lang:t,kurssiKey:e.key},o=g.map(i=>y(i,r,a)).join("");return`
    ${v(e,t)}
    <section class="co-modes" aria-label="Harjoitustyypit">
      ${o}
    </section>
    ${$(a)}`}function k(e,t){e.innerHTML=`
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="co-error" role="alert">
      <p>${c(t||"Kurssia ei l\xF6ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function w(e,t){m("screen-course-overview");let a=document.getElementById("co-root");if(!a)return;if(a.innerHTML='<p class="co-loading">Ladataan kurssia&hellip;</p>',!t||!e){k(a,"Kurssin tunnistetta ei annettu.");return}let r=await f(e,t);if(!r){k(a,"Kurssia ei l\xF6ytynyt. Onkohan tunniste oikein?");return}a.innerHTML=j(r,e),a.querySelectorAll(".co-mode").forEach(o=>{o.addEventListener("click",async i=>{let n=o.dataset.mode;if(o.getAttribute("aria-disabled")==="true"){i.preventDefault();return}if(n==="path"){i.preventDefault();try{let s=await import("./app-curriculum-76KX7QYP.js");s._setExpandedKurssi&&s._setExpandedKurssi(r.key)}catch{}location.hash==="#/oppimispolku"?import("./app-dashboard-NA6L4JWZ.js").then(s=>s.loadDashboard?.()).catch(()=>{}):location.hash="#/oppimispolku"}})}),a.querySelector("#co-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(o=>o.openPaywallModal?.()).catch(()=>{})})}function T(e){let t=/^#\/kurssi\/([a-z]{2})\/([^/?#]+)/i.exec(e||"");if(!t)return!1;let a=t[1].toLowerCase(),r=decodeURIComponent(t[2]);return w(a,r),!0}export{w as loadCourseOverview,T as tryRouteCourseOverview};
//# sourceMappingURL=app-courseOverview-32DGLCK3.js.map
