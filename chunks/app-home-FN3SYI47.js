import{a as S,b as T}from"./app-chunk-7KFQ2POU.js";import{d as $}from"./app-chunk-2SASPNNN.js";import{c as A}from"./app-chunk-MIWMNCCI.js";import{a as b,c as _,e as k,j as g,o as y,p as v}from"./app-chunk-M4LELO7W.js";import{b as w}from"./app-chunk-PXMVMW5B.js";var J=["pro","treeni","lifetime","trialing","active"];function f(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return J.some(t=>a.includes(t))}var M="puheo:next_topic_v1",L="puheo:next_topic_log_v1",N={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function K(e){if(!_())return null;let a=N[e]||N.es;try{let t=await g(`${b}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...k()},body:JSON.stringify({language:e,availableTopics:a})});if(!t.ok)return null;let s=await t.json();return s?.topic?{topic:s.topic,source:s.source||"uniform",gapsCount:s.gapsCount||0,at:Date.now(),lang:e}:null}catch{return null}}function Y(e){if(e)try{sessionStorage.setItem(M,JSON.stringify(e));let a=[];try{let t=sessionStorage.getItem(L);t&&(a=JSON.parse(t))}catch{}Array.isArray(a)||(a=[]),a.push(e),a.length>50&&(a=a.slice(-50)),sessionStorage.setItem(L,JSON.stringify(a))}catch{}}var G=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],q="puheo:enabled-langs",I="puheo:lang";var i=null;function H(){try{let e=localStorage.getItem(q);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}function r(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function F(){let e=H();try{let a=localStorage.getItem(I);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function X(e){try{localStorage.setItem(I,e)}catch{}}async function U(){let e=await v();return e&&(i={ts:Date.now(),payload:e}),e}function j(e){let a=H(),t=G.filter(s=>a.includes(s.code));return t.length<2?"":t.map(s=>`
    <button type="button"
            class="home-tab ${s.code===e?"is-active":""}"
            data-lang="${s.code}"
            role="tab"
            aria-selected="${s.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${s.flag}</span>
      <span class="home-tab__label">${r(s.label)}</span>
    </button>
  `).join("")}var C="2026-09-28";function W(){let e=new Date;e.setHours(0,0,0,0);let a=new Date(`${C}T00:00:00`);return Math.max(0,Math.round((a-e)/864e5))}function B(){let[e,a,t]=C.split("-").map(Number);return`${t}.${a}.${e}`}function R(){return`
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${W()}</span> p\xE4iv\xE4\xE4</p>
      <p class="dash-block__sub">Syksyn koe ${B()}</p>
    </section>`}function V(e){let a=e?.learningPath,t=Number(a?.totalTopics??0);if(!a||t<1)return"";let s=Math.min(t,Number(a.masteredCount??0)),n=t>0?Math.round(s/t*100):0;return`
    <section class="dash-block dash-block--progress" aria-label="Kurssiedistyminen">
      <p class="dash-block__label">Oppimispolku</p>
      <p class="dash-block__big"><span class="dash-block__num">${s}</span> / ${t} aihetta</p>
      <div class="dash-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
        <span class="dash-bar__fill" style="width:${n}%"></span>
      </div>
      <p class="dash-block__sub">${n}&nbsp;% hallussa</p>
    </section>`}function z(e){let a=e?.weakTopics?.topics;return!Array.isArray(a)||a.length===0?"":`
    <div class="dash-card__weak">
      <span class="dash-card__weak-label">Harjoittele:</span>
      <span class="dash-chips">${a.slice(0,3).map(s=>`<span class="dash-chip">${r(s.label||s.topic||"")}</span>`).join("")}</span>
    </div>`}function Q(e){let a=Number(e?.dashboard?.streak??0);return a<1?"":`<p class="dash-card__streak"><strong>${a}</strong> p\xE4iv\xE4n putki</p>`}function Z(e,a){let t=e?.dashboard||{},s=e?.profile?.profile||window._userProfile||null,n=Number(t?.totalSessions??0),o=null;try{let h=sessionStorage.getItem("currentLesson");h&&(o=JSON.parse(h))}catch{}let l=s?.preferred_name||(s?.full_name?s.full_name.split(" ")[0]:"")||"",m=l?`Hei, ${r(l)}. `:"Hei. ",D=n===0&&!o,c,p,u,d;if(D)c=`${m}Aloita ensimm\xE4inen oppitunti.`,p="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",u="Aloita",d=`#/oppimispolku?lang=${r(a)}`;else if(o?.title){let h=String(o.title).slice(0,80);c=`${m}Jatka oppituntiin: ${r(h)}.`,p="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",u="Jatka oppituntiin",d=o.href||`#/oppimispolku?lang=${r(a)}`}else c=`${m}Jatka oppimispolulla.`,p="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",u="Avaa oppimispolku",d=`#/oppimispolku?lang=${r(a)}`;return`
    <section class="dash-card" aria-label="Seuraava askel">
      <div class="dash-card__head">
        <h1 class="home-next__title dash-card__title">${c}</h1>
        ${Q(e)}
      </div>
      <p class="dash-card__meta">${r(p)}</p>
      <a class="home-next__cta dash-card__cta"
         data-cta-primary="true"
         href="${d}"
         data-action="continue">
        ${r(u)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
      ${z(e)}
    </section>`}function x(e,a,t){let s=j(e),n=V(a);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    <div class="dash-grid${n?"":" dash-grid--solo"}">
      ${R()}
      ${n}
    </div>
    ${Z(a,e)}
  `}function E(e){e.querySelectorAll(".home-tab").forEach(a=>{a.addEventListener("click",()=>{let t=a.dataset.lang;t&&(X(t),$(t),y(),i=null,ae())})})}function ee(e){let a=j(e);return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${a?`<div class="home-tabs" aria-hidden="true">${a}</div>`:""}
      <div class="dash-grid" aria-hidden="true">
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
      </div>
      <section class="dash-card dash-card--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
    </div>`}function P(e,a){let t=e.querySelector(".home-next__cta");t&&t.addEventListener("click",async s=>{if(t.dataset.busy==="1")return;s.preventDefault(),t.dataset.busy="1",t.setAttribute("aria-busy","true");let n=t.getAttribute("href")||`#/oppimispolku?lang=${a}`,o=null;try{o=await Promise.race([K(a),new Promise(l=>setTimeout(()=>l(null),1200))])}catch{o=null}o&&Y(o),t.dataset.busy="0",t.removeAttribute("aria-busy"),location.hash=n.startsWith("#")?n:`#${n}`})}function O(e,a){let t=e.querySelector(".home-next__cta");t&&T(t,()=>{S("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-AM47D27W.js")),A(a)})}async function ae(){w("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=F();if(i&&Date.now()-i.ts<6e4){let n=i.payload,o=f(n?.profile?.profile);window._isPro=o,e.innerHTML=x(a,n,o),E(e),O(e,a),P(e,a);return}e.innerHTML=ee(a);let t=await U(),s=f(t?.profile?.profile);window._isPro=s,e.innerHTML=x(a,t,s),E(e),O(e,a),P(e,a)}export{ae as loadHome};
//# sourceMappingURL=app-home-FN3SYI47.js.map
