import{a as h,b as u}from"./app-chunk-7KFQ2POU.js";import{c as p}from"./app-chunk-P4RMEY33.js";import{p as _}from"./app-chunk-ECRDZOTG.js";import{b as g}from"./app-chunk-3WC2U67L.js";var j=["pro","treeni","lifetime","trialing","active"];function f(e){let a=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return j.some(s=>a.includes(s))}var D=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],T="puheo:enabled-langs",w="puheo:lang",E=15,d=null;function S(){try{let e=localStorage.getItem(T);if(e){let a=JSON.parse(e);if(Array.isArray(a)&&a.length)return a}}catch{}return["es"]}function n(e){return String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function M(){let e=S();try{let a=localStorage.getItem(w);if(a&&e.includes(a))return a}catch{}return e[0]||"es"}function I(e){try{localStorage.setItem(w,e)}catch{}}async function K(){let e=await _();return e&&(d={ts:Date.now(),payload:e}),e}function H(e=new Date){let a=e.toLocaleDateString("fi-FI",{weekday:"long"}),s=e.getDate(),t=e.toLocaleDateString("fi-FI",{month:"long"});return`${a.charAt(0).toUpperCase()+a.slice(1)} ${s}. ${t}`}function k(e){let a=S(),s=D.filter(t=>a.includes(t.code));return s.length<2?"":s.map(t=>`
    <button type="button"
            class="home-tab ${t.code===e?"is-active":""}"
            data-lang="${t.code}"
            role="tab"
            aria-selected="${t.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${t.flag}</span>
      <span class="home-tab__label">${n(t.label)}</span>
    </button>
  `).join("")}function N(e){let a=e?.preferred_name||e?.full_name||window._userProfile?.preferred_name||"",s=a?`Hei, ${n(a)}!`:"Hei!",t=n(H());return`
    <header class="home-head">
      <h1 class="home-greeting">${s}</h1>
      <p class="home-date-pill" aria-label="P\xE4iv\xE4m\xE4\xE4r\xE4">${t}</p>
    </header>`}function x(e,a){let s=Number(e?.totalSessions??0),t=null;try{let m=sessionStorage.getItem("currentLesson");m&&(t=JSON.parse(m))}catch{}let o=s===0&&!t,r=o?"Aloita ensimm\xE4inen kurssi":"Jatka oppimispolulla",l=o?"Yksi oppitunti per p\xE4iv\xE4 riitt\xE4\xE4 alkuun.":"Avaa viimeisin kurssisi ja jatka siit\xE4 mihin j\xE4it.",c=o?"Tervetuloa":"Jatka t\xE4st\xE4",i=o?"Aloita \u2192":"Jatka \u2192";return`
    <a class="home-continue ${o?"is-fresh":""}"
       href="#/oppimispolku?lang=${n(a)}"
       data-action="continue">
      <div class="home-continue__body">
        <p class="home-continue__eyebrow">${n(c)}</p>
        <h2 class="home-continue__title">${n(r)}</h2>
        <p class="home-continue__sub">${n(l)}</p>
      </div>
      <span class="home-continue__cta">${n(i)}</span>
    </a>`}function C(e){let a=e?.dashboard||{},s=e?.profile?.profile||window._userProfile||{},t=Number(a.streak??0),o=Number(s.preferred_session_length||E),r=new Date().toISOString().slice(0,10),c=(Array.isArray(a.chartData)?a.chartData:[]).filter(P=>P?.createdAt?.slice(0,10)===r).length,i=Math.min(o,c*3),m=Math.max(0,Math.min(100,Math.round(i/o*100))),A=i>=o,L=t>=1?`<span class="home-goal__streak-num">${t}</span><span class="home-goal__streak-unit">pv putki</span>`:'<span class="home-goal__streak-empty">Aloita putki t\xE4n\xE4\xE4n</span>';return`
    <section class="home-goal" aria-label="P\xE4iv\xE4n tavoite">
      <div class="home-goal__streak ${t>=7?"is-hot":""} ${t===0?"is-empty":""}">
        ${L}
      </div>
      <div class="home-goal__progress">
        <div class="home-goal__progress-head">
          <span class="home-goal__progress-label">P\xE4iv\xE4n tavoite</span>
          <span class="home-goal__progress-val">${i} / ${o} min</span>
        </div>
        <div class="home-goal__bar" role="progressbar"
             aria-valuemin="0" aria-valuemax="${o}" aria-valuenow="${i}">
          <div class="home-goal__fill ${A?"is-met":""}" style="width:${m}%"></div>
        </div>
      </div>
    </section>`}var F=[{id:"sanasto",name:"Sanasto",modeKey:"vocab",href:e=>`#/oppimispolku?lang=${e}`},{id:"kielioppi",name:"Kielioppi",modeKey:"grammar",href:e=>`#/oppimispolku?lang=${e}`},{id:"luetun",name:"Luetun ymm\xE4rt\xE4minen",modeKey:"reading",href:e=>`#/luetun?lang=${e}`},{id:"kirjoitus",name:"Kirjoitus",modeKey:"writing",href:e=>`#/kirjoitus?lang=${e}`}];function G(e,a){let s=e?.modeStats||{};return`
    <section class="home-tracks" aria-label="Kurssipolku">
      <p class="home-tracks__eyebrow">Kurssipolku</p>
      <div class="home-tracks__grid">${F.map(o=>{let r=s[o.modeKey]||{},l=Number(r.sessions??0),c=Math.max(0,Math.min(100,Math.round(l/30*100))),i=l===0?"Ei viel\xE4 aloitettu":`${l} ${l===1?"harjoitus":"harjoitusta"}`;return`
      <a class="home-track" href="${o.href(a)}" data-track="${o.id}">
        <h3 class="home-track__name">${n(o.name)}</h3>
        <div class="home-track__bar" aria-hidden="true">
          <div class="home-track__bar-fill" style="width:${c}%"></div>
        </div>
        <p class="home-track__meta">${n(i)}</p>
      </a>`}).join("")}</div>
    </section>`}function O(e,a){let s=a?"":'<span class="home-footer__lock" aria-hidden="true">\u{1F512}</span>';return`
    <footer class="home-footer">
      <a class="home-footer__link" href="#/koeharjoitus?lang=${n(e)}" data-action="exam">
        ${s}<span>Koeharjoitus</span>
        <span class="home-footer__arrow" aria-hidden="true">\u2192</span>
      </a>
    </footer>`}function b(e,a,s){let t=a?.dashboard||{},o=a?.profile?.profile||window._userProfile||null;return`
    ${N(o)}
    ${k(e)?`<div class="home-tabs" role="tablist" aria-label="Kielet">${k(e)}</div>`:""}
    ${x(t,e)}
    ${C(a)}
    ${G(t,e)}
    ${O(e,s)}
  `}function v(e){e.querySelectorAll(".home-tab").forEach(a=>{a.addEventListener("click",()=>{let s=a.dataset.lang;s&&(I(s),J())})})}function q(e){let a=k(e),s=Array.from({length:4}).map(()=>`
    <div class="home-track home-track--skel" aria-hidden="true">
      <span class="home-skel home-skel--track-name"></span>
      <span class="home-skel home-skel--track-bar"></span>
      <span class="home-skel home-skel--track-meta"></span>
    </div>`).join("");return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4\u2026</span>
      <header class="home-head" aria-hidden="true">
        <span class="home-skel home-skel--greeting"></span>
        <span class="home-skel home-skel--date"></span>
      </header>
      ${a?`<div class="home-tabs" aria-hidden="true">${a}</div>`:""}
      <div class="home-continue home-continue--skel" aria-hidden="true">
        <div class="home-continue__body">
          <span class="home-skel home-skel--eyebrow"></span>
          <span class="home-skel home-skel--title"></span>
          <span class="home-skel home-skel--sub"></span>
        </div>
        <span class="home-skel home-skel--cta"></span>
      </div>
      <section class="home-goal home-goal--skel" aria-hidden="true">
        <span class="home-skel home-skel--streak"></span>
        <span class="home-skel home-skel--goal-bar"></span>
      </section>
      <section class="home-tracks" aria-hidden="true">
        <span class="home-skel home-skel--eyebrow"></span>
        <div class="home-tracks__grid">${s}</div>
      </section>
    </div>`}function $(e,a){let s=e.querySelector(".home-continue");s&&u(s,()=>{h("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-DJIA5V5Q.js")),p(a)}),e.querySelectorAll(".home-track").forEach(t=>{let o=t.dataset.track;u(t,()=>{o==="sanasto"||o==="kielioppi"?(h("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-DJIA5V5Q.js")),p(a)):o==="luetun"?h("reading",()=>import("./app-reading-WRTCSLZM.js")):o==="kirjoitus"&&h("writing",()=>import("./app-writing-3FOCVTWA.js"))})})}function y(e){e.querySelectorAll("[data-action='exam']").forEach(a=>{a.addEventListener("click",s=>{!(a.dataset.unlocked==="1")&&!window._isPro&&(s.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(o=>o.openPaywallModal?.()).catch(()=>{}))})})}async function J(){g("screen-home");let e=document.getElementById("home-root");if(!e)return;let a=M();if(d&&Date.now()-d.ts<6e4){let o=d.payload,r=f(o?.profile?.profile);window._isPro=r,e.innerHTML=b(a,o,r),v(e),y(e),$(e,a);return}e.innerHTML=q(a);let s=await K(),t=f(s?.profile?.profile);window._isPro=t,e.innerHTML=b(a,s,t),v(e),y(e),$(e,a)}export{J as loadHome};
//# sourceMappingURL=app-home-3ZE64DYF.js.map
