import{a as m,b as _}from"./app-chunk-7KFQ2POU.js";import{c as b}from"./app-chunk-UF63D4UW.js";import{a as k,c as y,e as v,j as w,p as $}from"./app-chunk-ECRDZOTG.js";import{b as S}from"./app-chunk-PXMVMW5B.js";var D=["pro","treeni","lifetime","trialing","active"];function g(t){let e=(t?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return D.some(a=>e.includes(a))}var H="puheo:next_topic_v1",A="puheo:next_topic_log_v1",P={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function M(t){if(!y())return null;let e=P[t]||P.es;try{let a=await w(`${k}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...v()},body:JSON.stringify({language:t,availableTopics:e})});if(!a.ok)return null;let n=await a.json();return n?.topic?{topic:n.topic,source:n.source||"uniform",gapsCount:n.gapsCount||0,at:Date.now(),lang:t}:null}catch{return null}}function C(t){if(t)try{sessionStorage.setItem(H,JSON.stringify(t));let e=[];try{let a=sessionStorage.getItem(A);a&&(e=JSON.parse(a))}catch{}Array.isArray(e)||(e=[]),e.push(t),e.length>50&&(e=e.slice(-50)),sessionStorage.setItem(A,JSON.stringify(e))}catch{}}var J=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],K="puheo:enabled-langs",E="puheo:lang",q=15,f=null;function I(){try{let t=localStorage.getItem(K);if(t){let e=JSON.parse(t);if(Array.isArray(e)&&e.length)return e}}catch{}return["es"]}function i(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Y(){let t=I();try{let e=localStorage.getItem(E);if(e&&t.includes(e))return e}catch{}return t[0]||"es"}function G(t){try{localStorage.setItem(E,t)}catch{}}async function F(){let t=await $();return t&&(f={ts:Date.now(),payload:t}),t}function O(t){let e=I(),a=J.filter(n=>e.includes(n.code));return a.length<2?"":a.map(n=>`
    <button type="button"
            class="home-tab ${n.code===t?"is-active":""}"
            data-lang="${n.code}"
            role="tab"
            aria-selected="${n.code===t?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${n.flag}</span>
      <span class="home-tab__label">${i(n.label)}</span>
    </button>
  `).join("")}function R(t,e,a){let n=Number(t?.totalSessions??0),o=null;try{let d=sessionStorage.getItem("currentLesson");d&&(o=JSON.parse(d))}catch{}let s=e?.preferred_name||(e?.full_name?e.full_name.split(" ")[0]:"")||"",l=s?`Hei, ${i(s)}. `:"Hei. ",u=n===0&&!o,r,c,h,p;if(u)r=`${l}Aloita ensimm\xE4inen oppitunti.`,c="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",h="Aloita",p=`#/oppimispolku?lang=${i(a)}`;else if(o?.title){let d=String(o.title).slice(0,80);r=`${l}Jatka oppituntiin: ${i(d)}.`,c="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",h="Jatka oppituntiin",p=o.href||`#/oppimispolku?lang=${i(a)}`}else r=`${l}Jatka oppimispolulla.`,c="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",h="Avaa oppimispolku",p=`#/oppimispolku?lang=${i(a)}`;return`
    <section class="home-next" aria-label="Seuraava askel">
      <h1 class="home-next__title">${r}</h1>
      <p class="home-next__meta">${i(c)}</p>
      <a class="home-next__cta"
         data-cta-primary="true"
         href="${p}"
         data-action="continue">
        ${i(h)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
    </section>`}function X(t){let e=t?.dashboard||{},a=t?.profile?.profile||window._userProfile||{},n=Number(e.streak??0),o=Number(a.preferred_session_length||q),s=new Date().toISOString().slice(0,10),u=(Array.isArray(e.chartData)?e.chartData:[]).filter(p=>p?.createdAt?.slice(0,10)===s).length,r=Math.min(o,u*3);if(n<1&&r<=0)return"";let c=[];return n>=1&&c.push(`<strong class="home-pulse__num">${n}</strong> p\xE4iv\xE4n putki`),r>0&&c.push(`t\xE4n\xE4\xE4n <strong class="home-pulse__num">${r}</strong> / ${o} min`),`
    <section class="home-pulse ${r>=o?"is-met":""}" aria-label="P\xE4iv\xE4n eteneminen">
      <p class="home-pulse__line">${c.join(", ")}.</p>
    </section>`}function B(t,e,a){let n=t?.modeStats||{},o=s=>{let l=n[s]||{},u=Number(l.sessions??0);return u===0?"Ei viel\xE4 aloitettu":`${u} ${u===1?"harjoitus":"harjoitusta"}`};return[{id:"sanasto",label:"Sanasto",meta:o("vocab"),href:`#/oppimispolku?lang=${e}`},{id:"kielioppi",label:"Kielioppi",meta:o("grammar"),href:`#/oppimispolku?lang=${e}`},{id:"luetun",label:"Luetun ymm\xE4rt\xE4minen",meta:o("reading"),href:`#/luetun?lang=${e}`},{id:"kirjoitus",label:"Kirjoitusteht\xE4v\xE4",meta:o("writing"),href:`#/kirjoitus?lang=${e}`},{id:"koeharjoitus",label:"Koeharjoitus",meta:a?"T\xE4ysi YO-koerunko":"Pro-j\xE4senille",href:`#/koeharjoitus?lang=${e}`,locked:!a}]}function U(t,e,a){return`
    <section class="home-paths" aria-label="Muut harjoitukset">
      <ol class="home-paths__list">${B(t,e,a).map(o=>`
      <li class="home-path">
        <a class="home-path__row ${o.locked?"is-locked":""}"
           href="${o.href}"
           data-path="${o.id}"
           ${o.locked?'data-unlocked="0" data-action="exam"':""}>
          <span class="home-path__label">${i(o.label)}</span>
          <span class="home-path__meta">${i(o.meta)}</span>
          <span class="home-path__arrow" aria-hidden="true">\u2192</span>
        </a>
      </li>`).join("")}</ol>
    </section>`}function T(t,e,a){let n=e?.dashboard||{},o=e?.profile?.profile||window._userProfile||null,s=O(t);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    ${R(n,o,t)}
    ${X(e)}
    ${U(n,t,a)}
  `}function x(t){t.querySelectorAll(".home-tab").forEach(e=>{e.addEventListener("click",()=>{let a=e.dataset.lang;a&&(G(a),z())})})}function W(t){let e=O(t),a=Array.from({length:5}).map(()=>`
    <li class="home-path home-path--skel" aria-hidden="true">
      <span class="home-skel home-skel--path-label"></span>
      <span class="home-skel home-skel--path-meta"></span>
    </li>`).join("");return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${e?`<div class="home-tabs" aria-hidden="true">${e}</div>`:""}
      <section class="home-next home-next--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
      <section class="home-paths" aria-hidden="true">
        <ol class="home-paths__list">${a}</ol>
      </section>
    </div>`}function j(t,e){let a=t.querySelector(".home-next__cta");a&&a.addEventListener("click",async n=>{if(a.dataset.busy==="1")return;n.preventDefault(),a.dataset.busy="1",a.setAttribute("aria-busy","true");let o=a.getAttribute("href")||`#/oppimispolku?lang=${e}`,s=null;try{s=await Promise.race([M(e),new Promise(l=>setTimeout(()=>l(null),1200))])}catch{s=null}s&&C(s),a.dataset.busy="0",a.removeAttribute("aria-busy"),location.hash=o.startsWith("#")?o:`#${o}`})}function L(t,e){let a=t.querySelector(".home-next__cta");a&&_(a,()=>{m("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-6UHZATKZ.js")),b(e)}),t.querySelectorAll(".home-path__row").forEach(n=>{let o=n.dataset.path;_(n,()=>{o==="sanasto"||o==="kielioppi"?(m("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-6UHZATKZ.js")),b(e)):o==="luetun"?m("reading",()=>import("./app-reading-KPV7B2CP.js")):o==="kirjoitus"&&m("writing",()=>import("./app-writing-FLSTENGF.js"))})})}function N(t){t.querySelectorAll("[data-action='exam']").forEach(e=>{e.addEventListener("click",a=>{!(e.dataset.unlocked==="1")&&!window._isPro&&(a.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(o=>o.openPaywallModal?.()).catch(()=>{}))})})}async function z(){S("screen-home");let t=document.getElementById("home-root");if(!t)return;let e=Y();if(f&&Date.now()-f.ts<6e4){let o=f.payload,s=g(o?.profile?.profile);window._isPro=s,t.innerHTML=T(e,o,s),x(t),N(t),L(t,e),j(t,e);return}t.innerHTML=W(e);let a=await F(),n=g(a?.profile?.profile);window._isPro=n,t.innerHTML=T(e,a,n),x(t),N(t),L(t,e),j(t,e)}export{z as loadHome};
//# sourceMappingURL=app-home-4PY3V7TN.js.map
