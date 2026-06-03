import{a as w,b as A}from"./app-chunk-7KFQ2POU.js";import{d as $}from"./app-chunk-2SASPNNN.js";import{c as T}from"./app-chunk-APZT2EDY.js";import{a as k,c as _,e as b,j as g,o as v,p as y}from"./app-chunk-T52YLBP4.js";import{b as S}from"./app-chunk-PXMVMW5B.js";var C=["pro","treeni","lifetime","trialing","active"];function j(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return C.some(t=>a.includes(t))}var D="puheo:next_topic_v1",x="puheo:next_topic_log_v1",N={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function J(e){if(!_())return null;let a=N[e]||N.es;try{let t=await g(`${k}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...b()},body:JSON.stringify({language:e,availableTopics:a})});if(!t.ok)return null;let s=await t.json();return s?.topic?{topic:s.topic,source:s.source||"uniform",gapsCount:s.gapsCount||0,at:Date.now(),lang:e}:null}catch{return null}}function K(e){if(e)try{sessionStorage.setItem(D,JSON.stringify(e));let a=[];try{let t=sessionStorage.getItem(x);t&&(a=JSON.parse(t))}catch{}Array.isArray(a)||(a=[]),a.push(e),a.length>50&&(a=a.slice(-50)),sessionStorage.setItem(x,JSON.stringify(a))}catch{}}var Y=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],G="puheo:enabled-langs",E="puheo:lang";var c=null,f="puheo:ohjaamo_cache_v1";function q(e,a){if(!e)return;let t={ts:Date.now(),payload:e,lang:a};c=t;try{localStorage.setItem(f,JSON.stringify(t))}catch{}}function z(e){if(c&&c.lang===e)return c;try{let a=localStorage.getItem(f);if(a){let t=JSON.parse(a);if(t&&t.payload&&t.lang===e)return c=t,t}}catch{}return null}function B(){c=null;try{localStorage.removeItem(f)}catch{}}function I(){try{let e=localStorage.getItem(G);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}function i(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function O(){let e=I();try{let a=localStorage.getItem(E);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function F(e){try{localStorage.setItem(E,e)}catch{}}async function L(e){let a=await y();return a&&q(a,e),a}function H(e){let a=I(),t=Y.filter(s=>a.includes(s.code));return t.length<2?"":t.map(s=>`
    <button type="button"
            class="home-tab ${s.code===e?"is-active":""}"
            data-lang="${s.code}"
            role="tab"
            aria-selected="${s.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${s.flag}</span>
      <span class="home-tab__label">${i(s.label)}</span>
    </button>
  `).join("")}var M="2026-09-28";function X(){let e=new Date;e.setHours(0,0,0,0);let a=new Date(`${M}T00:00:00`);return Math.max(0,Math.round((a-e)/864e5))}function U(){let[e,a,t]=M.split("-").map(Number);return`${t}.${a}.${e}`}function W(){return`
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${X()}</span> p\xE4iv\xE4\xE4</p>
      <p class="dash-block__sub">Syksyn koe ${U()}</p>
    </section>`}function R(e){let a=e?.learningPath,t=Number(a?.totalTopics??0);if(!a||t<1)return"";let s=Math.min(t,Number(a.masteredCount??0)),n=t>0?Math.round(s/t*100):0;return`
    <section class="dash-block dash-block--progress" aria-label="Kurssiedistyminen">
      <p class="dash-block__label">Oppimispolku</p>
      <p class="dash-block__big"><span class="dash-block__num">${s}</span> / ${t} aihetta</p>
      <div class="dash-bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100">
        <span class="dash-bar__fill" style="width:${n}%"></span>
      </div>
      <p class="dash-block__sub">${n}&nbsp;% hallussa</p>
    </section>`}function V(e){let a=e?.weakTopics?.topics;return!Array.isArray(a)||a.length===0?"":`
    <div class="dash-card__weak">
      <span class="dash-card__weak-label">Harjoittele:</span>
      <span class="dash-chips">${a.slice(0,3).map(s=>`<span class="dash-chip">${i(s.label||s.topic||"")}</span>`).join("")}</span>
    </div>`}function Q(e){let a=Number(e?.dashboard?.streak??0);return a<1?"":`<p class="dash-card__streak"><strong>${a}</strong> p\xE4iv\xE4n putki</p>`}function Z(e,a){let t=e?.dashboard||{},s=e?.profile?.profile||window._userProfile||null,n=Number(t?.totalSessions??0),o=null;try{let h=sessionStorage.getItem("currentLesson");h&&(o=JSON.parse(h))}catch{}let r=s?.preferred_name||(s?.full_name?s.full_name.split(" ")[0]:"")||"",m=r?`Hei, ${i(r)}. `:"Hei. ",P=n===0&&!o,l,p,u,d;if(P)l=`${m}Aloita ensimm\xE4inen oppitunti.`,p="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",u="Aloita",d=`#/oppimispolku?lang=${i(a)}`;else if(o?.title){let h=String(o.title).slice(0,80);l=`${m}Jatka oppituntiin: ${i(h)}.`,p="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",u="Jatka oppituntiin",d=o.href||`#/oppimispolku?lang=${i(a)}`}else l=`${m}Jatka oppimispolulla.`,p="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",u="Avaa oppimispolku",d=`#/oppimispolku?lang=${i(a)}`;return`
    <section class="dash-card" aria-label="Seuraava askel">
      <div class="dash-card__head">
        <h1 class="home-next__title dash-card__title">${l}</h1>
        ${Q(e)}
      </div>
      <p class="dash-card__meta">${i(p)}</p>
      <a class="home-next__cta dash-card__cta"
         data-cta-primary="true"
         href="${d}"
         data-action="continue">
        ${i(u)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
      ${V(e)}
    </section>`}function aa(e){return`
    <nav class="dash-actions" aria-label="Mit\xE4 haluat tehd\xE4">
      ${[{kind:"path",href:`#/oppimispolku?lang=${i(e)}`,title:"Jatka oppimispolkua",sub:"Kahdeksan kurssin polku, kielioppi ja sanasto mukana",icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},{kind:"exam",href:"#/koeharjoitus",title:"Harjoittele YO-koetta",sub:"Mallikoe aikarajalla, kuten oikeassa kokeessa",icon:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/>'},{kind:"write",href:"#/kirjoitus",title:"Kirjoita ja saa arvio",sub:"Teko\xE4ly pisteytt\xE4\xE4 kirjoituksesi YTL:n rubriikilla",icon:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'}].map(n=>`
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
    </nav>`}function ea(e,a,t){let s=H(e),n=R(a);return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    <div class="dash-grid${n?"":" dash-grid--solo"}">
      ${W()}
      ${n}
    </div>
    ${Z(a,e)}
    ${aa(e)}
  `}function ta(e){e.querySelectorAll(".home-tab").forEach(a=>{a.addEventListener("click",()=>{let t=a.dataset.lang;t&&(F(t),$(t),v(),B(),ia())})})}function sa(e){let a=H(e);return`
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
    </div>`}function na(e,a){let t=e.querySelector(".home-next__cta");t&&t.addEventListener("click",s=>{let n=t.getAttribute("href")||`#/oppimispolku?lang=${a}`;J(a).then(o=>{o&&K(o)}).catch(()=>{}),s.preventDefault(),location.hash=n.startsWith("#")?n:`#${n}`})}function oa(e,a){let t=e.querySelector(".home-next__cta");t&&A(t,()=>{w("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-T3Y2Q2H5.js")),T(a)})}async function ia(){S("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=O(),t=o=>{let r=j(o?.profile?.profile);window._isPro=r,e.innerHTML=ea(a,o,r),ta(e),oa(e,a),na(e,a)},s=z(a);if(s){t(s.payload),Date.now()-s.ts>=6e4&&L(a).then(o=>{if(!o)return;let r=document.getElementById("screen-home");r&&!r.hidden&&O()===a&&t(o)}).catch(()=>{});return}e.innerHTML=sa(a);let n=await L(a);t(n)}export{ia as loadHome};
//# sourceMappingURL=app-home-ILJ3SKUH.js.map
