import{a as u,c as d,e as p,j as m}from"./app-chunk-NZWTLFMY.js";import{b as h}from"./app-chunk-3WC2U67L.js";var _=new Map;function c(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function b(){let e=window._userProfile?.subscription_status||"";return["pro","treeni","lifetime","trialing","active"].some(a=>e.toLowerCase().includes(a))}async function f(e,a){let t=`${e}/${a}`,r=_.get(t);if(r&&Date.now()-r.ts<6e4)return r.kurssi;try{let o=await m(`${u}/api/curriculum?lang=${encodeURIComponent(e)}`,{headers:{...d()?p():{}}});if(!o.ok)return null;let i=await o.json(),n=Array.isArray(i?.kurssit)?i.kurssit:[],s=n.find(l=>l.key===a)||null;return s&&(s._stepNumber=n.findIndex(l=>l.key===a)+1,_.set(t,{ts:Date.now(),kurssi:s})),s}catch{return null}}var g=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssin sis&auml;lt&ouml; sanasto- ja kielioppi&shy;tehtavineen.",icon:"\u{1F4DA}",gateForFree:!1,badge:{free:"Yksi oppitunti per p&auml;iv&auml;",pro:null},target:({lang:e,kurssiKey:a})=>`#/oppimispolku?lang=${e}&kurssi=${encodeURIComponent(a)}`},{id:"writing",title:"Kirjoitusteht&auml;v&auml;",body:"AI arvioi tuotoksen YTL-rubriikilla. Saat pisteet ja konkreettiset korjaukset.",icon:"\u270D\uFE0F",gateForFree:!1,badge:{free:"3 teht&auml;v&auml;&auml; per kuukausi",pro:null},target:()=>"#/kirjoitus"},{id:"reading",title:"Luetun ymm&auml;rt&auml;minen",body:"Aitoja YO-tyylisi&auml; tekstej&auml; ja monivalintatehtaev&auml;t.",icon:"\u{1F4D6}",gateForFree:!1,badge:{free:"5 teksti&auml; per p&auml;iv&auml;",pro:null},target:()=>"#/luetun"},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",icon:"\u{1F393}",gateForFree:!0,badge:{free:"Avaa Treeni",pro:null},target:()=>"#/koeharjoitus"}];function v(e,a){let t=e._stepNumber||1,r=e.lessonsCompleted||0,o=e.lessonCount||10,i=Math.min(100,Math.round(r/o*100)),n=t*47%360,s=(n+28)%360;return`
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="co-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="co-breadcrumb__crumb is-current" aria-current="page">${c(`Kurssi ${t}`)}</span>
    </nav>
    <header class="co-hero">
      <div class="co-hero__cover"
           style="background: linear-gradient(135deg, oklch(72% 0.08 ${n}) 0%, oklch(58% 0.10 ${s}) 100%);">
        <span class="co-hero__num">${t}</span>
      </div>
      <div class="co-hero__body">
        <p class="co-hero__eyebrow">${c(`Kurssi ${t}`)} &middot; Taso ${c(e.level||"\u2014")}</p>
        <h1 class="co-hero__title display display--serif">${c(e.title||"")}</h1>
        ${e.description?`<p class="co-hero__desc">${c(e.description)}</p>`:""}
        <div class="co-hero__progress">
          <div class="co-hero__progress-bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="100" aria-label="${i} % suoritettu">
            <div class="co-hero__progress-fill" style="width:${i}%"></div>
          </div>
          <span class="co-hero__progress-text mono-num">${r} / ${o} oppituntia &middot; ${i} %</span>
        </div>
      </div>
    </header>`}function y(e,a,t){let r=t?e.badge.pro:e.badge.free,o=!t&&e.gateForFree,i=["co-mode",`co-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),n=e.target(a);return`
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
      <p class="co-upgrade__body">Treeni-tilauksella saat rajoittamattoman p&auml;&auml;syn jokaiseen kurssiin, koeharjoituksiin ja kirjoitustehtaiv&auml;n AI-arvioon.</p>
      <button type="button" class="co-upgrade__cta" id="co-upgrade-cta">Tutustu Treeniin \u2192</button>
    </aside>`}function j(e,a){let t=b(),r={lang:a,kurssiKey:e.key},o=g.map(i=>y(i,r,t)).join("");return`
    ${v(e,a)}
    <section class="co-modes" aria-label="Harjoitustyypit">
      ${o}
    </section>
    ${$(t)}`}function k(e,a){e.innerHTML=`
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="co-error" role="alert">
      <p>${c(a||"Kurssia ei l&ouml;ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`}async function w(e,a){h("screen-course-overview");let t=document.getElementById("co-root");if(!t)return;if(t.innerHTML='<p class="co-loading">Ladataan kurssia&hellip;</p>',!a||!e){k(t,"Kurssin tunnistetta ei annettu.");return}let r=await f(e,a);if(!r){k(t,"Kurssia ei l&ouml;ytynyt. Onkohan tunniste oikein?");return}t.innerHTML=j(r,e),t.querySelectorAll(".co-mode").forEach(o=>{o.addEventListener("click",async i=>{let n=o.dataset.mode;if(o.getAttribute("aria-disabled")==="true"){i.preventDefault();return}if(n==="path"){i.preventDefault();try{let s=await import("./app-curriculum-OPY6DZV3.js");s._setExpandedKurssi&&s._setExpandedKurssi(r.key),location.hash="#/oppimispolku",s.loadCurriculum&&s.loadCurriculum()}catch{location.hash="#/oppimispolku"}}})}),t.querySelector("#co-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(o=>o.openPaywallModal?.()).catch(()=>{})})}function T(e){let a=/^#\/kurssi\/([a-z]{2})\/([^/?#]+)/i.exec(e||"");if(!a)return!1;let t=a[1].toLowerCase(),r=decodeURIComponent(a[2]);return w(t,r),!0}export{w as loadCourseOverview,T as tryRouteCourseOverview};
//# sourceMappingURL=app-courseOverview-QXXI6CG5.js.map
