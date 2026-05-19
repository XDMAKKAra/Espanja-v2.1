import{a as u,c as p,e as h,j as m}from"./app-chunk-NZWTLFMY.js";import{b as f}from"./app-chunk-3WC2U67L.js";var j=["pro","treeni","lifetime","trialing","active"];function g(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return j.some(t=>a.includes(t))}var k=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],b="puheo:lang",c=null;function r(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function _(){try{let e=localStorage.getItem(b);if(e&&k.some(a=>a.code===e))return e}catch{}return"es"}function w(e){try{localStorage.setItem(b,e)}catch{}}async function L(){if(c&&Date.now()-c.ts<6e4)return c.payload;try{let e=await m(`${u}/api/dashboard/v2`,{headers:{...p()?h():{}}});if(!e.ok)return null;let a=await e.json();return c={ts:Date.now(),payload:a},a}catch{return null}}function A(e){return k.map(a=>`
    <button type="button"
            class="home-tab ${a.code===e?"is-active":""}"
            data-lang="${a.code}"
            role="tab"
            aria-selected="${a.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${a.flag}</span>
      <span class="home-tab__label">${r(a.label)}</span>
    </button>
  `).join("")}function d({label:e,value:a,locked:t}){return`
    <div class="ohjaamo-cell ${t?"is-locked":""}">
      <span class="ohjaamo-cell__label">${r(e)}</span>
      <span class="ohjaamo-cell__value">${t?'<span class="ohjaamo-cell__lock" aria-hidden="true">\u{1F512}</span>':""}${t?"\u2014":r(a)}</span>
    </div>`}function T(e,a){let t=e?.dashboard||{},o=t.streak??0,i=t.totalSessions??0,s=t.estLevel||t.currentLevel||"\u2014",n=t.yoReadinessPct!=null?`${t.yoReadinessPct} %`:"\u2014",l=a?"":`
    <div class="ohjaamo-upgrade">
      <p class="ohjaamo-upgrade__body">Avaa Treeni n\xE4hd\xE4ksesi tasosi ja YO-valmiusarvion sek\xE4 rajoittamattomat harjoitukset.</p>
      <button type="button" class="ohjaamo-upgrade__cta" id="ohjaamo-upgrade-cta">Tutustu Treeniin \u2192</button>
    </div>`;return`
    <section class="ohjaamo" aria-label="Ohjaamo">
      <p class="ohjaamo__eyebrow">Ohjaamo</p>
      <div class="ohjaamo__grid">
        ${d({label:"P\xE4iv\xE4n putki",value:`${o} pv`,locked:!1})}
        ${d({label:"Harjoituksia",value:`${i}`,locked:!1})}
        ${d({label:"Tasosi",value:s,locked:!a})}
        ${d({label:"YO-valmius",value:n,locked:!a})}
      </div>
      ${l}
    </section>`}var v=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssi sanasto- ja kielioppiteht\xE4vineen.",chip:"8 kurssia \xB7 80 oppituntia",freeBadge:"Yksi oppitunti per p\xE4iv\xE4",locked:!1,target:e=>`#/oppimispolku?lang=${e}`},{id:"writing",title:"Kirjoitusteht\xE4v\xE4",body:"AI arvioi tuotoksesi YTL-rubriikilla ja antaa konkreettiset korjaukset.",chip:"Lyhyt + pitk\xE4",freeBadge:"3 teht\xE4v\xE4\xE4 per kuukausi",locked:!1,target:e=>`#/kirjoitus?lang=${e}`},{id:"reading",title:"Luetun ymm\xE4rt\xE4minen",body:"Aitoja YO-tyylisi\xE4 tekstej\xE4 monivalintateht\xE4vineen.",chip:"180 teksti\xE4",freeBadge:"5 teksti\xE4 per p\xE4iv\xE4",locked:!1,target:e=>`#/luetun?lang=${e}`},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",chip:"T\xE4ysi YO-simulaatio",freeBadge:"Avaa Treeni",locked:!0,target:e=>`#/koeharjoitus?lang=${e}`}];function S(e,a,t){let o=e.locked&&!t,i=["home-mode",`home-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),s=t?"":`<span class="home-mode__badge ${o?"is-lock":""}">${o?"\u{1F512} ":""}${r(e.freeBadge)}</span>`;return`
    <a class="${i}" href="${e.target(a)}" data-mode="${e.id}" ${o?'aria-disabled="true"':""}>
      <div class="home-mode__body">
        <p class="home-mode__chip">${r(e.chip)}</p>
        <h3 class="home-mode__title">${r(e.title)}</h3>
        <p class="home-mode__desc">${r(e.body)}</p>
      </div>
      ${s}
    </a>`}function E(e,a,t){let o=A(e),i=v.map($=>S($,e,t)).join(""),s=a?.profile?.profile?.preferred_name||a?.profile?.profile?.full_name||window._userProfile?.preferred_name||"",n=new Date().getHours(),l=n<11?"Huomenta":n<18?"P\xE4iv\xE4\xE4":"Iltaa",y=s?`${l}, ${s}.`:`${l}.`;return`
    <header class="home-head">
      <h1 class="home-greeting display display--serif">${r(y)}</h1>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${o}</div>
    <div id="ohjaamo-root">${T(a,t)}</div>
    <section class="home-modes" aria-label="Harjoitustyypit">${i}</section>`}function O(e,a){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.lang;o&&(w(o),e.querySelectorAll(".home-tab").forEach(i=>{let s=i===t;i.classList.toggle("is-active",s),i.setAttribute("aria-selected",s?"true":"false")}),e.querySelectorAll(".home-mode").forEach(i=>{let s=i.dataset.mode,n=v.find(l=>l.id===s);n&&i.setAttribute("href",n.target(o))}))})})}function P(e){e.querySelector("#ohjaamo-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(a=>a.openPaywallModal?.()).catch(()=>{})}),e.querySelectorAll(".ohjaamo-cell.is-locked").forEach(a=>{a.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(t=>t.openPaywallModal?.()).catch(()=>{})}),a.style.cursor="pointer"})}function H(e,a){e.querySelectorAll(".home-mode").forEach(t=>{t.addEventListener("click",o=>{t.getAttribute("aria-disabled")==="true"&&(o.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(i=>i.openPaywallModal?.()).catch(()=>{}))})})}async function B(){f("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=_();e.innerHTML='<p class="home-loading">Ladataan\u2026</p>';let t=await L(),o=g(t?.profile?.profile);e.innerHTML=E(a,t,o),O(e,o),P(e),H(e,o)}export{B as loadHome};
//# sourceMappingURL=app-home-MB6PT2ML.js.map
