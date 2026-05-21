import{a as p,c as f,e as k,j as g}from"./app-chunk-NZWTLFMY.js";import{b as v}from"./app-chunk-3WC2U67L.js";var S=["pro","treeni","lifetime","trialing","active"];function m(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return S.some(t=>a.includes(t))}var T=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],E="puheo:enabled-langs";function $(){try{let e=localStorage.getItem(E);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}var w="puheo:lang",c=null;function n(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function O(){let e=$();try{let a=localStorage.getItem(w);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function P(e){try{localStorage.setItem(w,e)}catch{}}async function D(){if(c&&Date.now()-c.ts<6e4)return c.payload;try{let e=await g(`${p}/api/dashboard/v2`,{headers:{...f()?k():{}}});if(!e.ok)return null;let a=await e.json();return c={ts:Date.now(),payload:a},a}catch{return null}}function A(e){let a=$(),t=T.filter(o=>a.includes(o.code));return t.length<2?"":t.map(o=>`
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
    </div>`}function H(e){let a=e?.exam_date;if(!a)return null;let t=new Date(String(a));if(Number.isNaN(t.getTime()))return null;let o=new Date,s=t.getTime()-o.setHours(0,0,0,0),i=Math.round(s/864e5);return Number.isFinite(i)?i:null}function M(e,a){let t=e?.dashboard||{},o=t.streak??0,s=t.totalSessions??0,i=t.estLevel||t.currentLevel||"\u2014",r=t.yoReadinessPct!=null?`${t.yoReadinessPct} %`:"\u2014",l=H(e?.profile?.profile),u=l==null?"Aseta p\xE4iv\xE4":l<0?"Mennyt":l===0?"T\xE4n\xE4\xE4n":`${l} pv`,h=a?"":`
    <div class="ohjaamo-upgrade">
      <p class="ohjaamo-upgrade__body">Avaa Treeni n\xE4hd\xE4ksesi tasosi ja YO-valmiusarvion sek\xE4 rajoittamattomat harjoitukset.</p>
      <button type="button" class="ohjaamo-upgrade__cta" id="ohjaamo-upgrade-cta">Tutustu Treeniin \u2192</button>
    </div>`;return`
    <section class="ohjaamo" aria-label="Ohjaamo">
      <p class="ohjaamo__eyebrow">Ohjaamo</p>
      <div class="ohjaamo__grid">
        ${d({label:"YO-kokeeseen",value:u,locked:!1})}
        ${d({label:"P\xE4iv\xE4n putki",value:`${o} pv`,locked:!1})}
        ${d({label:"Harjoituksia",value:`${s}`,locked:!1})}
        ${d({label:"Tasosi",value:i,locked:!a})}
        ${d({label:"YO-valmius",value:r,locked:!a})}
      </div>
      ${h}
    </section>`}var L=[{id:"path",title:"Oppimispolku",body:"Vaiheittainen kurssi sanasto- ja kielioppiteht\xE4vineen.",chip:"8 kurssia \xB7 80 oppituntia",freeBadge:"Yksi oppitunti per p\xE4iv\xE4",locked:!1,target:e=>`#/oppimispolku?lang=${e}`},{id:"writing",title:"Kirjoitusteht\xE4v\xE4",body:"AI arvioi tuotoksesi YTL-rubriikilla ja antaa konkreettiset korjaukset.",chip:"Lyhyt + pitk\xE4",freeBadge:"3 teht\xE4v\xE4\xE4 per kuukausi",locked:!1,target:e=>`#/kirjoitus?lang=${e}`},{id:"reading",title:"Luetun ymm\xE4rt\xE4minen",body:"Aitoja YO-tyylisi\xE4 tekstej\xE4 monivalintateht\xE4vineen.",chip:"180 teksti\xE4",freeBadge:"5 teksti\xE4 per p\xE4iv\xE4",locked:!1,target:e=>`#/luetun?lang=${e}`},{id:"exam",title:"Koeharjoitus",body:"Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",chip:"T\xE4ysi YO-simulaatio",freeBadge:"Avaa Treeni",locked:!0,target:e=>`#/koeharjoitus?lang=${e}`}];function N(e,a,t){let o=e.locked&&!t,s=["home-mode",`home-mode--${e.id}`,o?"is-locked":""].filter(Boolean).join(" "),i=t?"":`<span class="home-mode__badge ${o?"is-lock":""}">${o?"\u{1F512} ":""}${n(e.freeBadge)}</span>`;return`
    <a class="${s}" href="${e.target(a)}" data-mode="${e.id}" ${o?'aria-disabled="true"':""}>
      <div class="home-mode__body">
        <p class="home-mode__chip">${n(e.chip)}</p>
        <h3 class="home-mode__title">${n(e.title)}</h3>
        <p class="home-mode__desc">${n(e.body)}</p>
      </div>
      ${i}
    </a>`}function b(e,a,t){let o=A(e),s=L.map(h=>N(h,e,t)).join(""),i=a?.profile?.profile?.preferred_name||a?.profile?.profile?.full_name||window._userProfile?.preferred_name||"",r=new Date().getHours(),l=r<11?"Huomenta":r<18?"P\xE4iv\xE4\xE4":"Iltaa",u=i?`${l}, ${i}.`:`${l}.`;return`
    <header class="home-head">
      <h1 class="home-greeting display display--serif">${n(u)}</h1>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${o}</div>
    <div id="ohjaamo-root">${M(a,t)}</div>
    <section class="home-modes" aria-label="Harjoitustyypit">${s}</section>`}function _(e,a){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.lang;o&&(P(o),e.querySelectorAll(".home-tab").forEach(s=>{let i=s===t;s.classList.toggle("is-active",i),s.setAttribute("aria-selected",i?"true":"false")}),e.querySelectorAll(".home-mode").forEach(s=>{let i=s.dataset.mode,r=L.find(l=>l.id===i);r&&s.setAttribute("href",r.target(o))}))})})}function y(e){e.querySelector("#ohjaamo-upgrade-cta")?.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(a=>a.openPaywallModal?.()).catch(()=>{})}),e.querySelectorAll(".ohjaamo-cell.is-locked").forEach(a=>{a.addEventListener("click",()=>{import("./app-paywallModal-DBYVV33A.js").then(t=>t.openPaywallModal?.()).catch(()=>{})}),a.style.cursor="pointer"})}function j(e,a){e.querySelectorAll(".home-mode").forEach(t=>{t.addEventListener("click",o=>{t.getAttribute("aria-disabled")==="true"&&(o.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(s=>s.openPaywallModal?.()).catch(()=>{}))})})}function Y(e){let a=A(e),t=Array.from({length:5}).map(()=>`
    <div class="ohjaamo-cell ohjaamo-cell--skel" aria-hidden="true">
      <span class="ohjaamo-cell__label home-skel home-skel--label"></span>
      <span class="ohjaamo-cell__value home-skel home-skel--value"></span>
    </div>`).join(""),o=Array.from({length:4}).map(()=>`
    <div class="home-mode home-mode--skel" aria-hidden="true">
      <div class="home-mode__body">
        <p class="home-mode__chip home-skel home-skel--chip"></p>
        <h3 class="home-mode__title home-skel home-skel--title"></h3>
        <p class="home-mode__desc home-skel home-skel--desc"></p>
      </div>
    </div>`).join("");return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4\u2026</span>
      <header class="home-head" aria-hidden="true">
        <h1 class="home-greeting display display--serif home-skel home-skel--greeting"></h1>
      </header>
      <div class="home-tabs" aria-hidden="true">${a}</div>
      <div id="ohjaamo-root">
        <section class="ohjaamo" aria-hidden="true">
          <p class="ohjaamo__eyebrow home-skel home-skel--eyebrow"></p>
          <div class="ohjaamo__grid">${t}</div>
        </section>
      </div>
      <section class="home-modes" aria-hidden="true">${o}</section>
    </div>`}async function K(){v("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=O();if(c&&Date.now()-c.ts<6e4){let s=c.payload,i=m(s?.profile?.profile);e.innerHTML=b(a,s,i),_(e,i),y(e),j(e,i);return}e.innerHTML=Y(a);let t=await D(),o=m(t?.profile?.profile);e.innerHTML=b(a,t,o),_(e,o),y(e),j(e,o)}export{K as loadHome};
//# sourceMappingURL=app-home-KA7JW2EZ.js.map
