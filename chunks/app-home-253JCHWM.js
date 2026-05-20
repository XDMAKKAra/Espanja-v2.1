import{a as u,c as h,e as p,j as m}from"./app-chunk-NZWTLFMY.js";import{b as f}from"./app-chunk-3WC2U67L.js";var $=["pro","treeni","lifetime","trialing","active"];function g(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return $.some(t=>a.includes(t))}var j=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],w="puheo:enabled-langs";function b(){try{let e=localStorage.getItem(w);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}var k="puheo:lang",c=null;function n(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function L(){let e=b();try{let a=localStorage.getItem(k);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function A(e){try{localStorage.setItem(k,e)}catch{}}async function S(){if(c&&Date.now()-c.ts<6e4)return c.payload;try{let e=await m(`${u}/api/dashboard/v2`,{headers:{...h()?p():{}}});if(!e.ok)return null;let a=await e.json();return c={ts:Date.now(),payload:a},a}catch{return null}}function E(e){let a=b(),t=j.filter(o=>a.includes(o.code));return t.length<2?"":t.map(o=>`
    <button type="button"
            class="home-tab ${o.code===e?"is-active":""}"
            data-lang="${o.code}"
            role="tab"
            aria-selected="${o.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${o.flag}</span>
      <span class="home-tab__label">${n(o.label)}</span>
    </button>
  `).join("")}function d({label:e,value:a,locked:t}){return`
    <div class="ohjaamo-cell ${t?"is-locked":""}">
      <span class="ohjaamo-cell__label">${n(e)}</span>
      <span class="ohjaamo-cell__value">${t?'<span class="ohjaamo-cell__lock" aria-hidden="true">\u{1F512}</span>':""}${t?"\u2014":n(a)}</span>
    </div>`}function T(e,a){let t=e?.dashboard||{},o=t.streak??0,i=t.totalSessions??0,s=t.estLevel||t.currentLevel||"\u2014",r=t.yoReadinessPct!=null?`${t.yoReadinessPct} %`:"\u2014",l=a?"":`
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
        ${d({label:"YO-valmius",value:r,locked:!a})}
      </div>
      ${l}
    </section>`}var v=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssi sanasto- ja kielioppiteht\xE4vineen.",chip:"8 kurssia \xB7 80 oppituntia",freeBadge:"Yksi oppitunti per p\xE4iv\xE4",locked:!1,target:e=>`#/oppimispolku?lang=${e}`},{id:"writing",title:"Kirjoitusteht\xE4v\xE4",body:"AI arvioi tuotoksesi YTL-rubriikilla ja antaa konkreettiset korjaukset.",chip:"Lyhyt + pitk\xE4",freeBadge:"3 teht\xE4v\xE4\xE4 per kuukausi",locked:!1,target:e=>`#/kirjoitus?lang=${e}`},{id:"reading",title:"Luetun ymm\xE4rt\xE4minen",body:"Aitoja YO-tyylisi\xE4 tekstej\xE4 monivalintateht\xE4vineen.",chip:"180 teksti\xE4",freeBadge:"5 teksti\xE4 per p\xE4iv\xE4",locked:!1,target:e=>`#/luetun?lang=${e}`},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",chip:"T\xE4ysi YO-simulaatio",freeBadge:"Avaa Treeni",locked:!0,target:e=>`#/koeharjoitus?lang=${e}`}];function O(e,a,t){let o=e.locked&&!t,i=["home-mode",`home-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),s=t?"":`<span class="home-mode__badge ${o?"is-lock":""}">${o?"\u{1F512} ":""}${n(e.freeBadge)}</span>`;return`
    <a class="${i}" href="${e.target(a)}" data-mode="${e.id}" ${o?'aria-disabled="true"':""}>
      <div class="home-mode__body">
        <p class="home-mode__chip">${n(e.chip)}</p>
        <h3 class="home-mode__title">${n(e.title)}</h3>
        <p class="home-mode__desc">${n(e.body)}</p>
      </div>
      ${s}
    </a>`}function P(e,a,t){let o=E(e),i=v.map(_=>O(_,e,t)).join(""),s=a?.profile?.profile?.preferred_name||a?.profile?.profile?.full_name||window._userProfile?.preferred_name||"",r=new Date().getHours(),l=r<11?"Huomenta":r<18?"P\xE4iv\xE4\xE4":"Iltaa",y=s?`${l}, ${s}.`:`${l}.`;return`
    <header class="home-head">
      <h1 class="home-greeting display display--serif">${n(y)}</h1>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${o}</div>
    <div id="ohjaamo-root">${T(a,t)}</div>
    <section class="home-modes" aria-label="Harjoitustyypit">${i}</section>`}function H(e,a){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.lang;o&&(A(o),e.querySelectorAll(".home-tab").forEach(i=>{let s=i===t;i.classList.toggle("is-active",s),i.setAttribute("aria-selected",s?"true":"false")}),e.querySelectorAll(".home-mode").forEach(i=>{let s=i.dataset.mode,r=v.find(l=>l.id===s);r&&i.setAttribute("href",r.target(o))}))})})}function I(e){e.querySelector("#ohjaamo-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(a=>a.openPaywallModal?.()).catch(()=>{})}),e.querySelectorAll(".ohjaamo-cell.is-locked").forEach(a=>{a.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(t=>t.openPaywallModal?.()).catch(()=>{})}),a.style.cursor="pointer"})}function Y(e,a){e.querySelectorAll(".home-mode").forEach(t=>{t.addEventListener("click",o=>{t.getAttribute("aria-disabled")==="true"&&(o.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(i=>i.openPaywallModal?.()).catch(()=>{}))})})}async function K(){f("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=L();e.innerHTML='<div class="home-loading" role="status" aria-label="Ladataan kotin\xE4ytt\xF6\xE4"><span class="sr-only">Ladataan\u2026</span></div>';let t=await S(),o=g(t?.profile?.profile);e.innerHTML=P(a,t,o),H(e,o),I(e),Y(e,o)}export{K as loadHome};
//# sourceMappingURL=app-home-253JCHWM.js.map
