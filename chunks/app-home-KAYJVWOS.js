import{a as m,b as _}from"./app-chunk-7KFQ2POU.js";import{c as k}from"./app-chunk-UF63D4UW.js";import{p as g}from"./app-chunk-ECRDZOTG.js";import{b as $}from"./app-chunk-PXMVMW5B.js";var j=["pro","treeni","lifetime","trialing","active"];function b(e){let t=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return j.some(s=>t.includes(s))}var x=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],E="puheo:enabled-langs",A="puheo:lang",T=15,f=null;function P(){try{let e=localStorage.getItem(E);if(e){let t=JSON.parse(e);if(Array.isArray(t)&&t.length)return t}}catch{}return["es"]}function i(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function N(){let e=P();try{let t=localStorage.getItem(A);if(t&&e.includes(t))return t}catch{}return e[0]||"es"}function D(e){try{localStorage.setItem(A,e)}catch{}}async function H(){let e=await g();return e&&(f={ts:Date.now(),payload:e}),e}function L(e){let t=P(),s=x.filter(o=>t.includes(o.code));return s.length<2?"":s.map(o=>`
    <button type="button"
            class="home-tab ${o.code===e?"is-active":""}"
            data-lang="${o.code}"
            role="tab"
            aria-selected="${o.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${o.flag}</span>
      <span class="home-tab__label">${i(o.label)}</span>
    </button>
  `).join("")}function I(e,t,s){let o=Number(e?.totalSessions??0),a=null;try{let d=sessionStorage.getItem("currentLesson");d&&(a=JSON.parse(d))}catch{}let n=t?.preferred_name||(t?.full_name?t.full_name.split(" ")[0]:"")||"",p=n?`Hei, ${i(n)}. `:"Hei. ",c=o===0&&!a,r,l,h,u;if(c)r=`${p}Aloita ensimm\xE4inen oppitunti.`,l="Yksi oppitunti p\xE4iv\xE4ss\xE4 riitt\xE4\xE4 alkuun.",h="Aloita",u=`#/oppimispolku?lang=${i(s)}`;else if(a?.title){let d=String(a.title).slice(0,80);r=`${p}Jatka oppituntiin: ${i(d)}.`,l="Avaa viimeisin teht\xE4v\xE4si siit\xE4 mihin j\xE4it.",h="Jatka oppituntiin",u=a.href||`#/oppimispolku?lang=${i(s)}`}else r=`${p}Jatka oppimispolulla.`,l="Avaa viimeisin kurssisi ja valitse seuraava oppitunti.",h="Avaa oppimispolku",u=`#/oppimispolku?lang=${i(s)}`;return`
    <section class="home-next" aria-label="Seuraava askel">
      <h1 class="home-next__title">${r}</h1>
      <p class="home-next__meta">${i(l)}</p>
      <a class="home-next__cta"
         data-cta-primary="true"
         href="${u}"
         data-action="continue">
        ${i(h)}
        <span class="home-next__cta-arrow" aria-hidden="true">\u2192</span>
      </a>
    </section>`}function M(e){let t=e?.dashboard||{},s=e?.profile?.profile||window._userProfile||{},o=Number(t.streak??0),a=Number(s.preferred_session_length||T),n=new Date().toISOString().slice(0,10),c=(Array.isArray(t.chartData)?t.chartData:[]).filter(u=>u?.createdAt?.slice(0,10)===n).length,r=Math.min(a,c*3);if(o<1&&r<=0)return"";let l=[];return o>=1&&l.push(`<strong class="home-pulse__num">${o}</strong> p\xE4iv\xE4n putki`),r>0&&l.push(`t\xE4n\xE4\xE4n <strong class="home-pulse__num">${r}</strong> / ${a} min`),`
    <section class="home-pulse ${r>=a?"is-met":""}" aria-label="P\xE4iv\xE4n eteneminen">
      <p class="home-pulse__line">${l.join(", ")}.</p>
    </section>`}function O(e,t,s){let o=e?.modeStats||{},a=n=>{let p=o[n]||{},c=Number(p.sessions??0);return c===0?"Ei viel\xE4 aloitettu":`${c} ${c===1?"harjoitus":"harjoitusta"}`};return[{id:"sanasto",label:"Sanasto",meta:a("vocab"),href:`#/oppimispolku?lang=${t}`},{id:"kielioppi",label:"Kielioppi",meta:a("grammar"),href:`#/oppimispolku?lang=${t}`},{id:"luetun",label:"Luetun ymm\xE4rt\xE4minen",meta:a("reading"),href:`#/luetun?lang=${t}`},{id:"kirjoitus",label:"Kirjoitusteht\xE4v\xE4",meta:a("writing"),href:`#/kirjoitus?lang=${t}`},{id:"koeharjoitus",label:"Koeharjoitus",meta:s?"T\xE4ysi YO-koerunko":"Pro-j\xE4senille",href:`#/koeharjoitus?lang=${t}`,locked:!s}]}function K(e,t,s){return`
    <section class="home-paths" aria-label="Muut harjoitukset">
      <ol class="home-paths__list">${O(e,t,s).map(a=>`
      <li class="home-path">
        <a class="home-path__row ${a.locked?"is-locked":""}"
           href="${a.href}"
           data-path="${a.id}"
           ${a.locked?'data-unlocked="0" data-action="exam"':""}>
          <span class="home-path__label">${i(a.label)}</span>
          <span class="home-path__meta">${i(a.meta)}</span>
          <span class="home-path__arrow" aria-hidden="true">\u2192</span>
        </a>
      </li>`).join("")}</ol>
    </section>`}function w(e,t,s){let o=t?.dashboard||{},a=t?.profile?.profile||window._userProfile||null,n=L(e);return`
    ${n?`<div class="home-tabs" role="tablist" aria-label="Kielet">${n}</div>`:""}
    ${I(o,a,e)}
    ${M(t)}
    ${K(o,e,s)}
  `}function v(e){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let s=t.dataset.lang;s&&(D(s),J())})})}function q(e){let t=L(e),s=Array.from({length:5}).map(()=>`
    <li class="home-path home-path--skel" aria-hidden="true">
      <span class="home-skel home-skel--path-label"></span>
      <span class="home-skel home-skel--path-meta"></span>
    </li>`).join("");return`
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4.</span>
      ${t?`<div class="home-tabs" aria-hidden="true">${t}</div>`:""}
      <section class="home-next home-next--skel" aria-hidden="true">
        <span class="home-skel home-skel--next-title"></span>
        <span class="home-skel home-skel--next-meta"></span>
        <span class="home-skel home-skel--next-cta"></span>
      </section>
      <section class="home-paths" aria-hidden="true">
        <ol class="home-paths__list">${s}</ol>
      </section>
    </div>`}function y(e,t){let s=e.querySelector(".home-next__cta");s&&_(s,()=>{m("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-56TW5ETA.js")),k(t)}),e.querySelectorAll(".home-path__row").forEach(o=>{let a=o.dataset.path;_(o,()=>{a==="sanasto"||a==="kielioppi"?(m("oppimispolkuIndex",()=>import("./app-oppimispolkuIndex-56TW5ETA.js")),k(t)):a==="luetun"?m("reading",()=>import("./app-reading-KPV7B2CP.js")):a==="kirjoitus"&&m("writing",()=>import("./app-writing-FLSTENGF.js"))})})}function S(e){e.querySelectorAll("[data-action='exam']").forEach(t=>{t.addEventListener("click",s=>{!(t.dataset.unlocked==="1")&&!window._isPro&&(s.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(a=>a.openPaywallModal?.()).catch(()=>{}))})})}async function J(){$("screen-home");let e=document.getElementById("home-root");if(!e)return;let t=N();if(f&&Date.now()-f.ts<6e4){let a=f.payload,n=b(a?.profile?.profile);window._isPro=n,e.innerHTML=w(t,a,n),v(e),S(e),y(e,t);return}e.innerHTML=q(t);let s=await H(),o=b(s?.profile?.profile);window._isPro=o,e.innerHTML=w(t,s,o),v(e),S(e),y(e,t)}export{J as loadHome};
//# sourceMappingURL=app-home-KAYJVWOS.js.map
