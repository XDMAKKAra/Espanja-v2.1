import{a as $,b as A}from"./app-chunk-7KFQ2POU.js";import{d as S}from"./app-chunk-2SASPNNN.js";import{c as T}from"./app-chunk-MIWMNCCI.js";import{a as _,c as b,e as g,j as y,o as v,p as k}from"./app-chunk-M4LELO7W.js";import{b as w}from"./app-chunk-PXMVMW5B.js";var j=["pro","treeni","lifetime","trialing","active"];function f(t){let e=(t?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return j.some(n=>e.includes(n))}var C="puheo:next_topic_v1",L="puheo:next_topic_log_v1",x={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function J(t){if(!b())return null;let e=x[t]||x.es;try{let n=await y(`${_}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...g()},body:JSON.stringify({language:t,availableTopics:e})});if(!n.ok)return null;let a=await n.json();return a?.topic?{topic:a.topic,source:a.source||"uniform",gapsCount:a.gapsCount||0,at:Date.now(),lang:t}:null}catch{return null}}function M(t){if(t)try{sessionStorage.setItem(C,JSON.stringify(t));let e=[];try{let n=sessionStorage.getItem(L);n&&(e=JSON.parse(n))}catch{}Array.isArray(e)||(e=[]),e.push(t),e.length>50&&(e=e.slice(-50)),sessionStorage.setItem(L,JSON.stringify(e))}catch{}}var G=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],K="puheo:enabled-langs",O="puheo:lang",Y=15,d=null;function D(){try{let t=localStorage.getItem(K);if(t){let e=JSON.parse(t);if(Array.isArray(e)&&e.length)return e}}catch{}return["es"]}function l(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function q(){let t=D();try{let e=localStorage.getItem(O);if(e&&t.includes(e))return e}catch{}return t[0]||"es"}function F(t){try{localStorage.setItem(O,t)}catch{}}async function X(){let t=await k();return t&&(d={ts:Date.now(),payload:t}),t}function H(t){let e=D(),n=G.filter(a=>e.includes(a.code));return n.length<2?"":n.map(a=>`
    <button type="button"
            class="home-tab ${a.code===t?"is-active":""}"
            data-lang="${a.code}"
            role="tab"
            aria-selected="${a.code===t?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${a.flag}</span>
      <span class="home-tab__label">${l(a.label)}</span>
    </button>
  `).join("")}function B(t,e,n){let a=Number(t?.totalSessions??0),o=null;try{let m=sessionStorage.getItem("currentLesson");m&&(o=JSON.parse(m))}catch{}let s=e?.preferred_name||(e?.full_name?e.full_name.split(" ")[0]:"")||"",c=s?`Hei, ${l(s)}. `:"Hei. ",h=a===0&&!o,r,i,p,u;if(h)r=`${c}Aloita ensimm\xE4inen oppitunti.`,i="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",p="Aloita",u=`#/oppimispolku?lang=${l(n)}`;else if(o?.title){let m=String(o.title).slice(0,80);r=`${c}Jatka oppituntiin: ${l(m)}.`,i="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",p="Jatka oppituntiin",u=o.href||`#/oppimispolku?lang=${l(n)}`}else r=`${c}Jatka oppimispolulla.`,i="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",p="Avaa oppimispolku",u=`#/oppimispolku?lang=${l(n)}`;return`
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
    </section>`}function R(t){let e=t?.dashboard||{},n=t?.profile?.profile||window._userProfile||{},a=Number(e.streak??0),o=Number(n.preferred_session_length||Y),s=new Date().toISOString().slice(0,10),h=(Array.isArray(e.chartData)?e.chartData:[]).filter(u=>u?.createdAt?.slice(0,10)===s).length,r=Math.min(o,h*3);if(a<1&&r<=0)return"";let i=[];return a>=1&&i.push(`<strong class="home-pulse__num">${a}</strong> p\xE4iv\xE4n putki`),r>0&&i.push(`t\xE4n\xE4\xE4n <strong class="home-pulse__num">${r}</strong> / ${o} min`),`
    <section class="home-pulse ${r>=o?"is-met":""}" aria-label="P\xE4iv\xE4n eteneminen">
      <p class="home-pulse__line">${i.join(", ")}.</p>
    </section>`}function N(t,e,n){let a=e?.dashboard||{},o=e?.profile?.profile||window._userProfile||null,s=H(t);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    ${B(a,o,t)}
    ${R(e)}
  `}function P(t){t.querySelectorAll(".home-tab").forEach(e=>{e.addEventListener("click",()=>{let n=e.dataset.lang;n&&(F(n),S(n),v(),d=null,V())})})}function U(t){let e=H(t);return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${e?`<div class="home-tabs" aria-hidden="true">${e}</div>`:""}
      <section class="home-next home-next--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
    </div>`}function E(t,e){let n=t.querySelector(".home-next__cta");n&&n.addEventListener("click",async a=>{if(n.dataset.busy==="1")return;a.preventDefault(),n.dataset.busy="1",n.setAttribute("aria-busy","true");let o=n.getAttribute("href")||`#/oppimispolku?lang=${e}`,s=null;try{s=await Promise.race([J(e),new Promise(c=>setTimeout(()=>c(null),1200))])}catch{s=null}s&&M(s),n.dataset.busy="0",n.removeAttribute("aria-busy"),location.hash=o.startsWith("#")?o:`#${o}`})}function I(t,e){let n=t.querySelector(".home-next__cta");n&&A(n,()=>{$("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-AM47D27W.js")),T(e)})}async function V(){w("screen-home");let t=document.getElementById("home-root");if(!t)return;let e=q();if(d&&Date.now()-d.ts<6e4){let o=d.payload,s=f(o?.profile?.profile);window._isPro=s,t.innerHTML=N(e,o,s),P(t),I(t,e),E(t,e);return}t.innerHTML=U(e);let n=await X(),a=f(n?.profile?.profile);window._isPro=a,t.innerHTML=N(e,n,a),P(t),I(t,e),E(t,e)}export{V as loadHome};
//# sourceMappingURL=app-home-HWNX7PXE.js.map
