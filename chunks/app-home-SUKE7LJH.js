import{a as S,b as w}from"./app-chunk-7KFQ2POU.js";import{c as $}from"./app-chunk-UF63D4UW.js";import{a as _,c as b,e as g,j as y,p as v}from"./app-chunk-ECRDZOTG.js";import{b as k}from"./app-chunk-PXMVMW5B.js";var D=["pro","treeni","lifetime","trialing","active"];function f(t){let e=(t?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return D.some(n=>e.includes(n))}var H="puheo:next_topic_v1",A="puheo:next_topic_log_v1",T={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function j(t){if(!b())return null;let e=T[t]||T.es;try{let n=await y(`${_}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...g()},body:JSON.stringify({language:t,availableTopics:e})});if(!n.ok)return null;let a=await n.json();return a?.topic?{topic:a.topic,source:a.source||"uniform",gapsCount:a.gapsCount||0,at:Date.now(),lang:t}:null}catch{return null}}function C(t){if(t)try{sessionStorage.setItem(H,JSON.stringify(t));let e=[];try{let n=sessionStorage.getItem(A);n&&(e=JSON.parse(n))}catch{}Array.isArray(e)||(e=[]),e.push(t),e.length>50&&(e=e.slice(-50)),sessionStorage.setItem(A,JSON.stringify(e))}catch{}}var J=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],M="puheo:enabled-langs",E="puheo:lang",G=15,m=null;function I(){try{let t=localStorage.getItem(M);if(t){let e=JSON.parse(t);if(Array.isArray(e)&&e.length)return e}}catch{}return["es"]}function l(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function K(){let t=I();try{let e=localStorage.getItem(E);if(e&&t.includes(e))return e}catch{}return t[0]||"es"}function Y(t){try{localStorage.setItem(E,t)}catch{}}async function q(){let t=await v();return t&&(m={ts:Date.now(),payload:t}),t}function O(t){let e=I(),n=J.filter(a=>e.includes(a.code));return n.length<2?"":n.map(a=>`
    <button type="button"
            class="home-tab ${a.code===t?"is-active":""}"
            data-lang="${a.code}"
            role="tab"
            aria-selected="${a.code===t?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${a.flag}</span>
      <span class="home-tab__label">${l(a.label)}</span>
    </button>
  `).join("")}function F(t,e,n){let a=Number(t?.totalSessions??0),o=null;try{let d=sessionStorage.getItem("currentLesson");d&&(o=JSON.parse(d))}catch{}let s=e?.preferred_name||(e?.full_name?e.full_name.split(" ")[0]:"")||"",c=s?`Hei, ${l(s)}. `:"Hei. ",h=a===0&&!o,r,i,p,u;if(h)r=`${c}Aloita ensimm\xE4inen oppitunti.`,i="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",p="Aloita",u=`#/oppimispolku?lang=${l(n)}`;else if(o?.title){let d=String(o.title).slice(0,80);r=`${c}Jatka oppituntiin: ${l(d)}.`,i="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",p="Jatka oppituntiin",u=o.href||`#/oppimispolku?lang=${l(n)}`}else r=`${c}Jatka oppimispolulla.`,i="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",p="Avaa oppimispolku",u=`#/oppimispolku?lang=${l(n)}`;return`
    <section class="home-next" aria-label="Seuraava askel">
      <h1 class="home-next__title">${r}</h1>
      <p class="home-next__meta">${l(i)}</p>
      <a class="home-next__cta"
         data-cta-primary="true"
         href="${u}"
         data-action="continue">
        ${l(p)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
    </section>`}function X(t){let e=t?.dashboard||{},n=t?.profile?.profile||window._userProfile||{},a=Number(e.streak??0),o=Number(n.preferred_session_length||G),s=new Date().toISOString().slice(0,10),h=(Array.isArray(e.chartData)?e.chartData:[]).filter(u=>u?.createdAt?.slice(0,10)===s).length,r=Math.min(o,h*3);if(a<1&&r<=0)return"";let i=[];return a>=1&&i.push(`<strong class="home-pulse__num">${a}</strong> p\xE4iv\xE4n putki`),r>0&&i.push(`t\xE4n\xE4\xE4n <strong class="home-pulse__num">${r}</strong> / ${o} min`),`
    <section class="home-pulse ${r>=o?"is-met":""}" aria-label="P\xE4iv\xE4n eteneminen">
      <p class="home-pulse__line">${i.join(", ")}.</p>
    </section>`}function x(t,e,n){let a=e?.dashboard||{},o=e?.profile?.profile||window._userProfile||null,s=O(t);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    ${F(a,o,t)}
    ${X(e)}
  `}function L(t){t.querySelectorAll(".home-tab").forEach(e=>{e.addEventListener("click",()=>{let n=e.dataset.lang;n&&(Y(n),R())})})}function B(t){let e=O(t);return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${e?`<div class="home-tabs" aria-hidden="true">${e}</div>`:""}
      <section class="home-next home-next--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
    </div>`}function N(t,e){let n=t.querySelector(".home-next__cta");n&&n.addEventListener("click",async a=>{if(n.dataset.busy==="1")return;a.preventDefault(),n.dataset.busy="1",n.setAttribute("aria-busy","true");let o=n.getAttribute("href")||`#/oppimispolku?lang=${e}`,s=null;try{s=await Promise.race([j(e),new Promise(c=>setTimeout(()=>c(null),1200))])}catch{s=null}s&&C(s),n.dataset.busy="0",n.removeAttribute("aria-busy"),location.hash=o.startsWith("#")?o:`#${o}`})}function P(t,e){let n=t.querySelector(".home-next__cta");n&&w(n,()=>{S("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-KXUN2FO3.js")),$(e)})}async function R(){k("screen-home");let t=document.getElementById("home-root");if(!t)return;let e=K();if(m&&Date.now()-m.ts<6e4){let o=m.payload,s=f(o?.profile?.profile);window._isPro=s,t.innerHTML=x(e,o,s),L(t),P(t,e),N(t,e);return}t.innerHTML=B(e);let n=await q(),a=f(n?.profile?.profile);window._isPro=a,t.innerHTML=x(e,n,a),L(t),P(t,e),N(t,e)}export{R as loadHome};
//# sourceMappingURL=app-home-SUKE7LJH.js.map
