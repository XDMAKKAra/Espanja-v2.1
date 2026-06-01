import{a as S,b as A}from"./app-chunk-7KFQ2POU.js";import{d as $}from"./app-chunk-2SASPNNN.js";import{c as T}from"./app-chunk-ST5ADWQP.js";import{a as k,c as b,e as _,j as v,o as g,p as y}from"./app-chunk-YZSB43V2.js";import{b as w}from"./app-chunk-PXMVMW5B.js";var D=["pro","treeni","lifetime","trialing","active"];function f(a){let e=(a?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return D.some(t=>e.includes(t))}var J="puheo:next_topic_v1",x="puheo:next_topic_log_v1",L={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function K(a){if(!b())return null;let e=L[a]||L.es;try{let t=await v(`${k}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",..._()},body:JSON.stringify({language:a,availableTopics:e})});if(!t.ok)return null;let s=await t.json();return s?.topic?{topic:s.topic,source:s.source||"uniform",gapsCount:s.gapsCount||0,at:Date.now(),lang:a}:null}catch{return null}}function Y(a){if(a)try{sessionStorage.setItem(J,JSON.stringify(a));let e=[];try{let t=sessionStorage.getItem(x);t&&(e=JSON.parse(t))}catch{}Array.isArray(e)||(e=[]),e.push(a),e.length>50&&(e=e.slice(-50)),sessionStorage.setItem(x,JSON.stringify(e))}catch{}}var G=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],q="puheo:enabled-langs",H="puheo:lang";var r=null;function O(){try{let a=localStorage.getItem(q);if(a){let e=JSON.parse(a);if(Array.isArray(e)&&e.length)return e}}catch{}return["es"]}function i(a){return String(a??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function z(){let a=O();try{let e=localStorage.getItem(H);if(e&&a.includes(e))return e}catch{}return a[0]||"es"}function F(a){try{localStorage.setItem(H,a)}catch{}}async function X(){let a=await y();return a&&(r={ts:Date.now(),payload:a}),a}function I(a){let e=O(),t=G.filter(s=>e.includes(s.code));return t.length<2?"":t.map(s=>`
    <button type="button"
            class="home-tab ${s.code===a?"is-active":""}"
            data-lang="${s.code}"
            role="tab"
            aria-selected="${s.code===a?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${s.flag}</span>
      <span class="home-tab__label">${i(s.label)}</span>
    </button>
  `).join("")}var M="2026-09-28";function B(){let a=new Date;a.setHours(0,0,0,0);let e=new Date(`${M}T00:00:00`);return Math.max(0,Math.round((e-a)/864e5))}function U(){let[a,e,t]=M.split("-").map(Number);return`${t}.${e}.${a}`}function W(){return`
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${B()}</span> p\xE4iv\xE4\xE4</p>
      <p class="dash-block__sub">Syksyn koe ${U()}</p>
    </section>`}function R(a){let e=a?.learningPath,t=Number(e?.totalTopics??0);if(!e||t<1)return"";let s=Math.min(t,Number(e.masteredCount??0)),n=t>0?Math.round(s/t*100):0;return`
    <section class="dash-block dash-block--progress" aria-label="Kurssiedistyminen">
      <p class="dash-block__label">Oppimispolku</p>
      <p class="dash-block__big"><span class="dash-block__num">${s}</span> / ${t} aihetta</p>
      <div class="dash-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
        <span class="dash-bar__fill" style="width:${n}%"></span>
      </div>
      <p class="dash-block__sub">${n}&nbsp;% hallussa</p>
    </section>`}function V(a){let e=a?.weakTopics?.topics;return!Array.isArray(e)||e.length===0?"":`
    <div class="dash-card__weak">
      <span class="dash-card__weak-label">Harjoittele:</span>
      <span class="dash-chips">${e.slice(0,3).map(s=>`<span class="dash-chip">${i(s.label||s.topic||"")}</span>`).join("")}</span>
    </div>`}function Q(a){let e=Number(a?.dashboard?.streak??0);return e<1?"":`<p class="dash-card__streak"><strong>${e}</strong> p\xE4iv\xE4n putki</p>`}function Z(a,e){let t=a?.dashboard||{},s=a?.profile?.profile||window._userProfile||null,n=Number(t?.totalSessions??0),o=null;try{let h=sessionStorage.getItem("currentLesson");h&&(o=JSON.parse(h))}catch{}let l=s?.preferred_name||(s?.full_name?s.full_name.split(" ")[0]:"")||"",m=l?`Hei, ${i(l)}. `:"Hei. ",C=n===0&&!o,c,p,u,d;if(C)c=`${m}Aloita ensimm\xE4inen oppitunti.`,p="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",u="Aloita",d=`#/oppimispolku?lang=${i(e)}`;else if(o?.title){let h=String(o.title).slice(0,80);c=`${m}Jatka oppituntiin: ${i(h)}.`,p="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",u="Jatka oppituntiin",d=o.href||`#/oppimispolku?lang=${i(e)}`}else c=`${m}Jatka oppimispolulla.`,p="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",u="Avaa oppimispolku",d=`#/oppimispolku?lang=${i(e)}`;return`
    <section class="dash-card" aria-label="Seuraava askel">
      <div class="dash-card__head">
        <h1 class="home-next__title dash-card__title">${c}</h1>
        ${Q(a)}
      </div>
      <p class="dash-card__meta">${i(p)}</p>
      <a class="home-next__cta dash-card__cta"
         data-cta-primary="true"
         href="${d}"
         data-action="continue">
        ${i(u)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
      ${V(a)}
    </section>`}function aa(a){return`
    <nav class="dash-actions" aria-label="Mit\xE4 haluat tehd\xE4">
      ${[{kind:"path",href:`#/oppimispolku?lang=${i(a)}`,title:"Jatka oppimispolkua",sub:"Kahdeksan kurssin polku, kielioppi ja sanasto mukana",icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},{kind:"exam",href:"#/koeharjoitus",title:"Harjoittele YO-koetta",sub:"Mallikoe aikarajalla, kuten oikeassa kokeessa",icon:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/>'},{kind:"write",href:"#/kirjoitus",title:"Kirjoita ja saa arvio",sub:"Teko\xE4ly pisteytt\xE4\xE4 kirjoituksesi YTL:n rubriikilla",icon:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'}].map(n=>`
    <a class="dash-action dash-action--${n.kind}" href="${n.href}">
      <span class="dash-action__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg>
      </span>
      <span class="dash-action__text">
        <span class="dash-action__title">${i(n.title)}</span>
        <span class="dash-action__sub">${i(n.sub)}</span>
      </span>
      <span class="dash-action__arrow" aria-hidden="true">\u2192</span>
    </a>`).join("")}
    </nav>`}function N(a,e,t){let s=I(a),n=R(e);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    <div class="dash-grid${n?"":" dash-grid--solo"}">
      ${W()}
      ${n}
    </div>
    ${Z(e,a)}
    ${aa(a)}
  `}function j(a){a.querySelectorAll(".home-tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.lang;t&&(F(t),$(t),g(),r=null,ta())})})}function ea(a){let e=I(a);return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${e?`<div class="home-tabs" aria-hidden="true">${e}</div>`:""}
      <div class="dash-grid" aria-hidden="true">
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
      </div>
      <section class="dash-card dash-card--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
    </div>`}function E(a,e){let t=a.querySelector(".home-next__cta");t&&t.addEventListener("click",async s=>{if(t.dataset.busy==="1")return;s.preventDefault(),t.dataset.busy="1",t.setAttribute("aria-busy","true");let n=t.getAttribute("href")||`#/oppimispolku?lang=${e}`,o=null;try{o=await Promise.race([K(e),new Promise(l=>setTimeout(()=>l(null),1200))])}catch{o=null}o&&Y(o),t.dataset.busy="0",t.removeAttribute("aria-busy"),location.hash=n.startsWith("#")?n:`#${n}`})}function P(a,e){let t=a.querySelector(".home-next__cta");t&&A(t,()=>{S("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-67CSM2FQ.js")),T(e)})}async function ta(){w("screen-home");let a=document.getElementById("home-root");if(!a)return;let e=z();if(r&&Date.now()-r.ts<6e4){let n=r.payload,o=f(n?.profile?.profile);window._isPro=o,a.innerHTML=N(e,n,o),j(a),P(a,e),E(a,e);return}a.innerHTML=ea(e);let t=await X(),s=f(t?.profile?.profile);window._isPro=s,a.innerHTML=N(e,t,s),j(a),P(a,e),E(a,e)}export{ta as loadHome};
//# sourceMappingURL=app-home-FUABWAYD.js.map
