import{a as E,b as O}from"./app-chunk-7KFQ2POU.js";import{a as _,b as I,c as P,d as C}from"./app-chunk-APZT2EDY.js";import{b as g}from"./app-chunk-DRZEAGMT.js";import{d as x}from"./app-chunk-2SASPNNN.js";import{a as w,c as $,e as S,j as A,o as T,p as L}from"./app-chunk-T52YLBP4.js";import{b as N}from"./app-chunk-PXMVMW5B.js";var X=new Set(["treeni","lifetime","trialing","active"]);function V(t){let e=(t?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase().trim();return X.has(e)}function j(t){return V(t)?(t?.subscription_tier||window._userProfile?.subscription_tier||"").toLowerCase().includes("mestari")?"kurssi":"treeni":"free"}var z="puheo:next_topic_v1",M="puheo:next_topic_log_v1",D={es:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","ser_estar","hay_estar","subjunctive","conditional","preterite_imperfect","pronouns"],fr:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","subjunctive","conditional","imparfait_passe_compose","pronouns"],de:["general vocabulary","society and politics","environment and nature","health and body","travel and transport","culture and arts","work and economy","perfekt_praeteritum","konjunktiv","modalverben","praepositionen"]};async function Q(t){if(!$())return null;let e=D[t]||D.es;try{let a=await A(`${w}/api/personalization/next-topic`,{method:"POST",headers:{"Content-Type":"application/json",...S()},body:JSON.stringify({language:t,availableTopics:e})});if(!a.ok)return null;let s=await a.json();return s?.topic?{topic:s.topic,source:s.source||"uniform",gapsCount:s.gapsCount||0,at:Date.now(),lang:t}:null}catch{return null}}function Z(t){if(t)try{sessionStorage.setItem(z,JSON.stringify(t));let e=[];try{let a=sessionStorage.getItem(M);a&&(e=JSON.parse(a))}catch{}Array.isArray(e)||(e=[]),e.push(t),e.length>50&&(e=e.slice(-50)),sessionStorage.setItem(M,JSON.stringify(e))}catch{}}var ee=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],te="puheo:enabled-langs",K="puheo:lang";var h=null,y="puheo:ohjaamo_cache_v1";function ae(t,e){if(!t)return;let a={ts:Date.now(),payload:t,lang:e};h=a;try{localStorage.setItem(y,JSON.stringify(a))}catch{}}function se(t){if(h&&h.lang===t)return h;try{let e=localStorage.getItem(y);if(e){let a=JSON.parse(e);if(a&&a.payload&&a.lang===t)return h=a,a}}catch{}return null}function ne(){h=null;try{localStorage.removeItem(y)}catch{}}function Y(){try{let t=localStorage.getItem(te);if(t){let e=JSON.parse(t);if(Array.isArray(e)&&e.length)return e}}catch{}return["es"]}function i(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function H(){let t=Y();try{let e=localStorage.getItem(K);if(e&&t.includes(e))return e}catch{}return t[0]||"es"}function re(t){try{localStorage.setItem(K,t)}catch{}}async function J(t){let e=await L();return e&&ae(e,t),e}function G(t){let e=Y(),a=ee.filter(s=>e.includes(s.code));return a.length<2?"":a.map(s=>`
    <button type="button"
            class="home-tab ${s.code===t?"is-active":""}"
            data-lang="${s.code}"
            role="tab"
            aria-selected="${s.code===t?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${s.flag}</span>
      <span class="home-tab__label">${i(s.label)}</span>
    </button>
  `).join("")}var B="2026-09-28",d=3,oe=8,b=["I","A","B","C","M","E","L"];function U(){let t=new Date;t.setHours(0,0,0,0);let e=new Date(`${B}T00:00:00`);return Math.max(0,Math.round((e-t)/864e5))}function ie(){let[t,e,a]=B.split("-").map(Number);return`${a}.${e}.${t}`}function q(t){let e=t?.dashboard?.recent;if(!Array.isArray(e))return 0;let a=new Date;a.setHours(0,0,0,0);let s=0;for(let n of e){let r=n?.createdAt||n?.created_at;if(!r)continue;let o=new Date(r);!Number.isNaN(o.getTime())&&o>=a&&s++}return s}function ce(t){let e=b.indexOf(t);if(e<0)return t;let a=b[Math.min(b.length-1,e+1)];return a===t?t:`${t} tai ${a}`}function le(t,e){return t>=1?`<p class="dash-hero__streak" aria-label="${t} p\xE4iv\xE4\xE4 putkeen">
      <span class="dash-hero__streak-num">${t}</span> p\xE4iv\xE4\xE4 putkeen</p>`:e?'<p class="dash-hero__streak dash-hero__streak--seed">P\xE4iv\xE4 1</p>':""}function ue(t,e){let a=t?.dashboard||{},s=t?.profile?.profile||window._userProfile||null,n=Number(a?.totalSessions??0),r=Number(a?.streak??0),o=null;try{let v=sessionStorage.getItem("currentLesson");v&&(o=JSON.parse(v))}catch{}let c=s?.preferred_name||(s?.full_name?s.full_name.split(" ")[0]:"")||"",l=c?`Hei, ${i(c)}.`:"Hei.",u=n===0&&!o,p,f,m,k;u?(p="Aloitetaan",f=`${l} Ensimm\xE4inen teht\xE4v\xE4si odottaa.`,m="Yksi lyhyt teht\xE4v\xE4 riitt\xE4\xE4 alkuun. Painetaan k\xE4yntiin.",k="Aloita"):o?.title?(p="Jatketaan",f=`${l} Jatka siit\xE4 mihin j\xE4it.`,m=`Seuraavana: ${i(String(o.title).slice(0,70))}.`,k="Jatka"):(p="Jatketaan",f=`${l} Seuraava teht\xE4v\xE4si on valmiina.`,m="Yksi napautus vie suoraan tekemiseen.",k="Jatka");let W=`#/oppimispolku?lang=${i(e)}`;return`
    <section class="dash-hero" aria-label="Jatka">
      <div class="dash-hero__head">
        <div class="dash-hero__greet">
          <p class="dash-hero__eyebrow">${i(p)}</p>
          <h1 class="dash-hero__title">${f}</h1>
          <p class="dash-hero__meta">${m}</p>
        </div>
        ${le(r,u)}
      </div>
      <button type="button" class="dash-hero__cta" data-cta-primary="true"
              data-next-task data-fallback="${W}">
        <span class="dash-hero__cta-label">${i(k)}</span>
        <span class="dash-hero__cta-arrow" aria-hidden="true">\u2192</span>
      </button>
      <nav class="dash-hero__secondary" aria-label="Muut teht\xE4v\xE4t">
        <a class="dash-hero__link" href="#/koeharjoitus">Harjoittele YO-koetta</a>
        <a class="dash-hero__link" href="#/kirjoitus">Kirjoita ja saa arvio</a>
      </nav>
    </section>`}function F(t,e,a){let n=2*Math.PI*26,r=e>0?Math.min(1,t/e):0,o=(n*(1-r)).toFixed(1),c=a?'<svg class="dash-ring__check" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>':`<span class="dash-ring__num">${t}</span>`;return`
    <div class="dash-ring${a?" is-met":""}">
      <svg viewBox="0 0 64 64" width="62" height="62" aria-hidden="true">
        <circle class="dash-ring__track" cx="32" cy="32" r="26" fill="none" stroke-width="7"/>
        <circle class="dash-ring__fill" cx="32" cy="32" r="26" fill="none" stroke-width="7"
                stroke-linecap="round" stroke-dasharray="${n.toFixed(1)}" stroke-dashoffset="${o}"
                transform="rotate(-90 32 32)"/>
      </svg>
      <span class="dash-ring__center">${c}</span>
    </div>`}function R({ring:t,label:e,count:a,sub:s,met:n,ariaLabel:r}){return`
    <section class="dash-block dash-block--goal${n?" is-met":""}" aria-label="${i(r)}">
      ${t}
      <div class="dash-goal__text">
        <p class="dash-block__label">${i(e)}</p>
        <p class="dash-goal__count">${i(a)}</p>
        <p class="dash-block__sub">${i(s)}</p>
      </div>
    </section>`}function de(t){let e=q(t),a=e>=d,s=Math.max(0,Math.round((d-e)*(oe/d)));return R({ring:F(e,d,a),label:"T\xE4n\xE4\xE4n",count:`${e} / ${d} teht\xE4v\xE4\xE4`,sub:a?"P\xE4iv\xE4n tavoite t\xE4ynn\xE4.":`Noin ${s} min j\xE4ljell\xE4.`,met:a,ariaLabel:"P\xE4iv\xE4n tavoite"})}function he(t,e){let a=t?.dashboard?.gradeEstimate;if((e==="treeni"||e==="kurssi")&&a&&a.tier!=="none"&&a.grade)return`T\xE4ll\xE4 tahdilla arviomme: ${i(a.grade)}.`;let s=t?.learningPath,n=Number(s?.totalTopics??0),r=Number(s?.masteredCount??0),o=n-r,c=U();if(n>0&&o>0&&c>7){let l=Math.max(1,Math.floor(c/7));return`Noin ${Math.ceil(o/l)} aihetta viikossa pit\xE4\xE4 sinut aikataulussa.`}return`Syksyn koe ${ie()}.`}function pe(t,e){return`
    <section class="dash-block dash-block--countdown" aria-label="Aikaa ylioppilaskokeeseen">
      <p class="dash-block__label">Ylioppilaskokeeseen</p>
      <p class="dash-block__big"><span class="dash-block__num">${U()}</span> p\xE4iv\xE4\xE4</p>
      <p class="dash-block__sub">${i(he(t,e))}</p>
    </section>`}function fe(t){let e=t?.dashboard?.gradeEstimate;return`
    <section class="dash-wall" aria-label="Treeni">
      <p class="dash-wall__label">P\xE4iv\xE4n tavoite t\xE4ynn\xE4</p>
      <h2 class="dash-wall__title">Huominen aukeaa Treeniss\xE4</h2>
      <p class="dash-wall__meta">Ilmaisversiossa teet kolme teht\xE4v\xE4\xE4 p\xE4iv\xE4ss\xE4. Treeniss\xE4 jatkat niin pitk\xE4lle kuin jaksat.</p>
      ${e&&e.tier!=="none"&&e.grade?`<div class="dash-wall__teaser">
         <span class="dash-wall__teaser-label">Arviomme YO-tasostasi</span>
         <span class="dash-wall__teaser-grade" aria-hidden="true">${i(ce(e.grade))}</span>
         <span class="sr-only">Avaa Treeni n\xE4hd\xE4ksesi tarkan arvion.</span>
       </div>`:'<p class="dash-wall__hint">Tee muutama teht\xE4v\xE4 lis\xE4\xE4, niin arvioimme YO-tasosi.</p>'}
      <button type="button" class="dash-wall__cta" data-open-paywall>Avaa Treeni</button>
    </section>`}async function me(t){try{let e=sessionStorage.getItem("currentLesson");if(e){let a=JSON.parse(e);if(a?.href&&/#\/oppitunti\//.test(a.href))return a.href}}catch{}try{let e=await _(t);if(Array.isArray(e)&&e.length){let a=e.find(s=>s.isUnlocked&&!s.kertausPassed)||e.find(s=>s.isUnlocked)||e[0];if(a?.key){let{lessons:s}=await I(t,a.key);if(Array.isArray(s)&&s.length){let r=(s.find(o=>!o.completed)||s[0])?.sortOrder||1;return`#/oppitunti/${t}/${encodeURIComponent(a.key)}/${r}`}}}}catch{}return`#/oppimispolku?lang=${encodeURIComponent(t)}`}function ke(t,e,a){let s=G(t),n=a==="free"&&q(e)>=d?fe(e):"";return`
    ${s?`<div class="home-tabs" role="tablist" aria-label="Kielet">${s}</div>`:""}
    <div class="home-canvas">
      <div class="home-canvas__main">
        ${ue(e,t)}
        ${n}
      </div>
      <aside class="home-canvas__rail" aria-label="Tilanne">
        ${de(e)}
        ${pe(e,a)}
      </aside>
    </div>
  `}function _e(t){t.querySelectorAll(".home-tab").forEach(e=>{e.addEventListener("click",()=>{let a=e.dataset.lang;a&&(re(a),x(a),T(),ne(),$e())})})}function be(t){let e=G(t);return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${e?`<div class="home-tabs" aria-hidden="true">${e}</div>`:""}
      <div class="home-canvas" aria-hidden="true">
        <div class="home-canvas__main">
          <section class="dash-hero dash-hero--skel">
            <span class="home-skel home-skel--next-title"></span>
            <span class="home-skel home-skel--next-meta"></span>
            <span class="home-skel home-skel--next-cta"></span>
          </section>
        </div>
        <aside class="home-canvas__rail">
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
          <section class="dash-block dash-block--skel"><span class="home-skel home-skel--block"></span></section>
        </aside>
      </div>
    </div>`}function ye(t,e){let a=t.querySelector("[data-next-task]");a&&a.addEventListener("click",async()=>{if(a.dataset.busy)return;a.dataset.busy="1",a.setAttribute("aria-busy","true");let s=a.querySelector(".dash-hero__cta-label");s&&(s.textContent="Avataan"),Q(e).then(r=>{r&&Z(r)}).catch(()=>{});let n=a.dataset.fallback||`#/oppimispolku?lang=${e}`;try{n=await me(e)}catch{}location.hash=n.startsWith("#")?n:`#${n}`})}function ve(t){let e=t.querySelector("[data-open-paywall]");e&&e.addEventListener("click",()=>g({variant:"quota",reason:"daily-goal"}))}function ge(t,e){let a=t.querySelector("[data-next-task]");a&&O(a,async()=>{E("lessonRunner",()=>import("./app-lessonRunner-YC72B6BE.js")),P(e);try{let s=await _(e),n=(s||[]).find(r=>r.isUnlocked&&!r.kertausPassed)||(s||[]).find(r=>r.isUnlocked);n?.key&&C(e,n.key)}catch{}})}async function we(t,e){try{let a=await _(e);if(!Array.isArray(a)||!a.length)return;let s=t.querySelector(".dash-block--goal");if(!s)return;let n=a.length,r=a.filter(u=>u.kertausPassed).length,o=r>=n,c=Math.min(n,r+1),l=a.find(u=>!u.kertausPassed);s.outerHTML=R({ring:F(r,n,o),label:"Kurssietenem\xE4",count:o?`Kaikki ${n} kurssia`:`Kurssi ${c} / ${n}`,sub:o?"Koko polku suoritettu.":l?.title?`Menossa: ${l.title}`:"Jatka polkua.",met:o,ariaLabel:"Kurssietenem\xE4"})}catch{}}async function $e(){N("screen-home");let t=document.getElementById("home-root");if(!t)return;let e=H(),a=r=>{let o=j(r?.profile?.profile);window._isPro=o!=="free",t.innerHTML=ke(e,r,o),_e(t),ge(t,e),ye(t,e),ve(t),o==="kurssi"&&we(t,e)},s=se(e);if(s){a(s.payload),Date.now()-s.ts>=6e4&&J(e).then(r=>{if(!r)return;let o=document.getElementById("screen-home");o&&!o.hidden&&H()===e&&a(r)}).catch(()=>{});return}t.innerHTML=be(e);let n=await J(e);a(n)}export{$e as loadHome};
//# sourceMappingURL=app-home-23GQNI4H.js.map
