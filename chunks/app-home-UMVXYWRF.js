import{a as h,c as m,e as f,j as g}from"./app-chunk-NZWTLFMY.js";import{b}from"./app-chunk-3WC2U67L.js";var $=["pro","treeni","lifetime","trialing","active"];function k(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return $.some(t=>a.includes(t))}var j=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],w="puheo:enabled-langs";function v(){try{let e=localStorage.getItem(w);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}var y="puheo:lang",d=null;function r(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function A(){let e=v();try{let a=localStorage.getItem(y);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function L(e){try{localStorage.setItem(y,e)}catch{}}async function S(){if(d&&Date.now()-d.ts<6e4)return d.payload;try{let e=await g(`${h}/api/dashboard/v2`,{headers:{...m()?f():{}}});if(!e.ok)return null;let a=await e.json();return d={ts:Date.now(),payload:a},a}catch{return null}}function T(e){let a=v(),t=j.filter(o=>a.includes(o.code));return t.length<2?"":t.map(o=>`
    <button type="button"
            class="home-tab ${o.code===e?"is-active":""}"
            data-lang="${o.code}"
            role="tab"
            aria-selected="${o.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${o.flag}</span>
      <span class="home-tab__label">${r(o.label)}</span>
    </button>
  `).join("")}function c({label:e,value:a,locked:t}){return`
    <div class="ohjaamo-cell ${t?"is-locked":""}">
      <span class="ohjaamo-cell__label">${r(e)}</span>
      <span class="ohjaamo-cell__value">${t?'<span class="ohjaamo-cell__lock" aria-hidden="true">\u{1F512}</span>':""}${t?"\u2014":r(a)}</span>
    </div>`}function E(e){let a=e?.exam_date;if(!a)return null;let t=new Date(String(a));if(Number.isNaN(t.getTime()))return null;let o=new Date,s=t.getTime()-o.setHours(0,0,0,0),i=Math.round(s/864e5);return Number.isFinite(i)?i:null}function O(e,a){let t=e?.dashboard||{},o=t.streak??0,s=t.totalSessions??0,i=t.estLevel||t.currentLevel||"\u2014",l=t.yoReadinessPct!=null?`${t.yoReadinessPct} %`:"\u2014",n=E(e?.profile?.profile),u=n==null?"Aseta p\xE4iv\xE4":n<0?"Mennyt":n===0?"T\xE4n\xE4\xE4n":`${n} pv`,p=a?"":`
    <div class="ohjaamo-upgrade">
      <p class="ohjaamo-upgrade__body">Avaa Treeni n\xE4hd\xE4ksesi tasosi ja YO-valmiusarvion sek\xE4 rajoittamattomat harjoitukset.</p>
      <button type="button" class="ohjaamo-upgrade__cta" id="ohjaamo-upgrade-cta">Tutustu Treeniin \u2192</button>
    </div>`;return`
    <section class="ohjaamo" aria-label="Ohjaamo">
      <p class="ohjaamo__eyebrow">Ohjaamo</p>
      <div class="ohjaamo__grid">
        ${c({label:"YO-kokeeseen",value:u,locked:!1})}
        ${c({label:"P\xE4iv\xE4n putki",value:`${o} pv`,locked:!1})}
        ${c({label:"Harjoituksia",value:`${s}`,locked:!1})}
        ${c({label:"Tasosi",value:i,locked:!a})}
        ${c({label:"YO-valmius",value:l,locked:!a})}
      </div>
      ${p}
    </section>`}var _=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssi sanasto- ja kielioppiteht\xE4vineen.",chip:"8 kurssia \xB7 80 oppituntia",freeBadge:"Yksi oppitunti per p\xE4iv\xE4",locked:!1,target:e=>`#/oppimispolku?lang=${e}`},{id:"writing",title:"Kirjoitusteht\xE4v\xE4",body:"AI arvioi tuotoksesi YTL-rubriikilla ja antaa konkreettiset korjaukset.",chip:"Lyhyt + pitk\xE4",freeBadge:"3 teht\xE4v\xE4\xE4 per kuukausi",locked:!1,target:e=>`#/kirjoitus?lang=${e}`},{id:"reading",title:"Luetun ymm\xE4rt\xE4minen",body:"Aitoja YO-tyylisi\xE4 tekstej\xE4 monivalintateht\xE4vineen.",chip:"180 teksti\xE4",freeBadge:"5 teksti\xE4 per p\xE4iv\xE4",locked:!1,target:e=>`#/luetun?lang=${e}`},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",chip:"T\xE4ysi YO-simulaatio",freeBadge:"Avaa Treeni",locked:!0,target:e=>`#/koeharjoitus?lang=${e}`}];function P(e,a,t){let o=e.locked&&!t,s=["home-mode",`home-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),i=t?"":`<span class="home-mode__badge ${o?"is-lock":""}">${o?"\u{1F512} ":""}${r(e.freeBadge)}</span>`;return`
    <a class="${s}" href="${e.target(a)}" data-mode="${e.id}" ${o?'aria-disabled="true"':""}>
      <div class="home-mode__body">
        <p class="home-mode__chip">${r(e.chip)}</p>
        <h3 class="home-mode__title">${r(e.title)}</h3>
        <p class="home-mode__desc">${r(e.body)}</p>
      </div>
      ${i}
    </a>`}function D(e,a,t){let o=T(e),s=_.map(p=>P(p,e,t)).join(""),i=a?.profile?.profile?.preferred_name||a?.profile?.profile?.full_name||window._userProfile?.preferred_name||"",l=new Date().getHours(),n=l<11?"Huomenta":l<18?"P\xE4iv\xE4\xE4":"Iltaa",u=i?`${n}, ${i}.`:`${n}.`;return`
    <header class="home-head">
      <h1 class="home-greeting display display--serif">${r(u)}</h1>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${o}</div>
    <div id="ohjaamo-root">${O(a,t)}</div>
    <section class="home-modes" aria-label="Harjoitustyypit">${s}</section>`}function H(e,a){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.lang;o&&(L(o),e.querySelectorAll(".home-tab").forEach(s=>{let i=s===t;s.classList.toggle("is-active",i),s.setAttribute("aria-selected",i?"true":"false")}),e.querySelectorAll(".home-mode").forEach(s=>{let i=s.dataset.mode,l=_.find(n=>n.id===i);l&&s.setAttribute("href",l.target(o))}))})})}function M(e){e.querySelector("#ohjaamo-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(a=>a.openPaywallModal?.()).catch(()=>{})}),e.querySelectorAll(".ohjaamo-cell.is-locked").forEach(a=>{a.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(t=>t.openPaywallModal?.()).catch(()=>{})}),a.style.cursor="pointer"})}function N(e,a){e.querySelectorAll(".home-mode").forEach(t=>{t.addEventListener("click",o=>{t.getAttribute("aria-disabled")==="true"&&(o.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(s=>s.openPaywallModal?.()).catch(()=>{}))})})}async function q(){b("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=A();e.innerHTML='<div class="home-loading" role="status" aria-label="Ladataan kotin\xE4ytt\xF6\xE4"><span class="sr-only">Ladataan\u2026</span></div>';let t=await S(),o=k(t?.profile?.profile);e.innerHTML=D(a,t,o),H(e,o),M(e),N(e,o)}export{q as loadHome};
//# sourceMappingURL=app-home-UMVXYWRF.js.map
