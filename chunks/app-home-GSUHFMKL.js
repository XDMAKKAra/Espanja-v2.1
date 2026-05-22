import{a as b,c as y,e as g,j}from"./app-chunk-NZWTLFMY.js";import{b as w}from"./app-chunk-3WC2U67L.js";var T=["pro","treeni","lifetime","trialing","active"];function v(e){let t=(e?.subscription_status||window._userProfile?.subscription_status||"").toLowerCase();return T.some(a=>t.includes(a))}var C=[{code:"es",label:"Espanja",flag:"\u{1F1EA}\u{1F1F8}"},{code:"fr",label:"Ranska",flag:"\u{1F1EB}\u{1F1F7}"},{code:"de",label:"Saksa",flag:"\u{1F1E9}\u{1F1EA}"}],q="puheo:enabled-langs",x="puheo:lang",H=15,h=null,$={es:{label:"Espanja",courses:[{num:1,title:"Tervehdys ja arki",hook:"Aloita ensimm\xE4isist\xE4 lauseista."},{num:2,title:"Arjen rutiinit",hook:"P\xE4iv\xE4n rytmi ja toistuvat tavat."},{num:3,title:"Matkailu ja kaupungit",hook:"Sanoja juna-asemalle ja kahvilaan."},{num:4,title:"Ennen ja nyt",hook:"Menneest\xE4 imperfektill\xE4, nyt nykyisin."},{num:5,title:"Ymp\xE4rist\xF6 ja maisema",hook:"Luonto, kaupunki ja kest\xE4vyys."},{num:6,title:"Ty\xF6 ja opiskelu",hook:"Ammatit, suunnitelmat ja CV-sanasto."},{num:7,title:"Terveys ja hyvinvointi",hook:"Vartalo, l\xE4\xE4k\xE4ri ja arjen kunto."},{num:8,title:"Kulttuuri ja taide",hook:"Elokuva, musiikki ja kirjallisuus."}]},fr:{label:"Ranska",courses:[{num:1,title:"Salutations et quotidien",hook:"Aloita ensimm\xE4isist\xE4 lauseista."},{num:2,title:"Routines quotidiennes",hook:"P\xE4iv\xE4n rytmi ja toistuvat tavat."},{num:3,title:"Voyages et villes",hook:"Sanoja juna-asemalle ja kahvilaan."},{num:4,title:"Avant et maintenant",hook:"Menneest\xE4 imperfektill\xE4, nyt nykyisin."},{num:5,title:"Environnement et paysage",hook:"Luonto, kaupunki ja kest\xE4vyys."},{num:6,title:"Travail et \xE9tudes",hook:"Ammatit, suunnitelmat ja CV-sanasto."},{num:7,title:"Sant\xE9 et bien-\xEAtre",hook:"Vartalo, l\xE4\xE4k\xE4ri ja arjen kunto."},{num:8,title:"Culture et arts",hook:"Elokuva, musiikki ja kirjallisuus."}]},de:{label:"Saksa",courses:[{num:1,title:"Begr\xFC\xDFung und Alltag",hook:"Aloita ensimm\xE4isist\xE4 lauseista."},{num:2,title:"Alltagsroutinen",hook:"P\xE4iv\xE4n rytmi ja toistuvat tavat."},{num:3,title:"Reisen und St\xE4dte",hook:"Sanoja juna-asemalle ja kahvilaan."},{num:4,title:"Fr\xFCher und heute",hook:"Menneest\xE4 imperfektill\xE4, nyt nykyisin."},{num:5,title:"Umwelt und Landschaft",hook:"Luonto, kaupunki ja kest\xE4vyys."},{num:6,title:"Arbeit und Studium",hook:"Ammatit, suunnitelmat ja CV-sanasto."},{num:7,title:"Gesundheit und Wohl",hook:"Vartalo, l\xE4\xE4k\xE4ri ja arjen kunto."},{num:8,title:"Kultur und Kunst",hook:"Elokuva, musiikki ja kirjallisuus."}]}},S={es:[{title:"Subjunktiivi & ojal\xE1",body:"K\xE4yt\xE4 subjunktiivia kun ojal\xE1 tai querer que aloittaa lauseen."},{title:"Ser vs estar",body:"Pysyv\xE4 ominaisuus = ser. Tilap\xE4inen tila tai sijainti = estar."},{title:"Por vai para",body:"Por kertoo syyn tai v\xE4lineen. Para kertoo tarkoituksen tai m\xE4\xE4r\xE4np\xE4\xE4n."},{title:"Aksentti pelastaa",body:"Pieni \xE1 ratkaisee onko sanasta substantiivi vai verbi."},{title:"Imperfekti vs preteriti",body:"Imperfekti maalaa taustaa. Preteriti kertoo mit\xE4 tapahtui."},{title:"Hay tai est\xE1",body:"Hay = on olemassa (uusi tieto). Est\xE1 = on tietyss\xE4 paikassa."},{title:"Lue \xE4\xE4neen p\xE4ivitt\xE4in",body:"Viisi minuuttia \xE4\xE4neen lukua treenaa korvaa nopeammin kuin sanalistat."}],fr:[{title:"Avoir vai \xEAtre",body:"Useimmat verbit k\xE4ytt\xE4v\xE4t avoir-pass\xE9ssa, liikeverbit \xEAtre."},{title:"Subjonctif & il faut que",body:"Il faut que ja je veux que vet\xE4v\xE4t verbin subjonctiviin."},{title:"C'est vai il est",body:"C'est + substantiivi tai adjektiivi yksin. Il est + ammatti tai adjektiivi henkil\xF6st\xE4."},{title:"Du, de la, des",body:"Osa-artikkeli kertoo ett\xE4 otat osan: du pain, de la confiture, des pommes."},{title:"Imparfait vai pass\xE9 compos\xE9",body:"Imparfait maalaa taustaa. Pass\xE9 compos\xE9 kertoo p\xE4\xE4ttyneen tapahtuman."},{title:"Y ja en pronominit",body:"Y korvaa paikan tai \xE0+asia. En korvaa de+asia tai m\xE4\xE4r\xE4n."},{title:"Lue ranskaa \xE4\xE4neen",body:"Viisi minuuttia \xE4\xE4neen lukua opettaa korvalle nasaalit ja liaison-s\xE4\xE4nn\xF6t."}],de:[{title:"Der, die, das",body:"Suku ei seuraa logiikkaa \u2014 opettele se osana substantiivia."},{title:"Trennbare Verben",body:"Aufstehen \u2192 ich stehe um sieben auf. Etuliite vaeltaa lauseen loppuun."},{title:"Akkusativ vai Dativ",body:"Akkusativ = liike kohti (in die Stadt). Dativ = paikka jossa (in der Stadt)."},{title:"Modaaliverbit + Infinitiv",body:"K\xF6nnen, m\xFCssen, wollen viev\xE4t p\xE4\xE4verbin infinitiivin lauseen loppuun."},{title:"Perfekti vs Imperfekti",body:"Puheessa Perfekti (ich habe gemacht). Kirjoituksessa Imperfekti (ich machte)."},{title:"Sanaj\xE4rjestys",body:"Verbi on lauseessa toinen elementti \u2014 vaikka edess\xE4 olisi adverbi tai aikam\xE4\xE4re."},{title:"Lue saksaa \xE4\xE4neen",body:"Viisi minuuttia \xE4\xE4neen lukua treenaa korvan \xE4, \xF6, \xFC ja ch-\xE4\xE4niin."}]};function V(e){let t=S[e]||S.es,a=new Date().getDay();return t[a%t.length]}function D(){try{let e=localStorage.getItem(q);if(e){let t=JSON.parse(e);if(Array.isArray(t)&&t.length)return t}}catch{}return["es"]}function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function N(){let e=D();try{let t=localStorage.getItem(x);if(t&&e.includes(t))return t}catch{}return e[0]||"es"}function K(e){try{localStorage.setItem(x,e)}catch{}}async function F(){if(h&&Date.now()-h.ts<6e4)return h.payload;try{let e=await j(`${b}/api/dashboard/v2`,{headers:{...y()?g():{}}});if(!e.ok)return null;let t=await e.json();return h={ts:Date.now(),payload:t},t}catch{return null}}function R(e=new Date){let t=e.toLocaleDateString("fi-FI",{weekday:"long"}),a=e.getDate(),s=e.toLocaleDateString("fi-FI",{month:"long"});return`${t.charAt(0).toUpperCase()+t.slice(1)} ${a}. ${s}`}function B(e){let t=D(),a=C.filter(s=>t.includes(s.code));return a.length<2?"":a.map(s=>`
    <button type="button"
            class="home-tab ${s.code===e?"is-active":""}"
            data-lang="${s.code}"
            role="tab"
            aria-selected="${s.code===e?"true":"false"}">
      <span class="home-tab__flag" aria-hidden="true">${s.flag}</span>
      <span class="home-tab__label">${o(s.label)}</span>
    </button>
  `).join("")}function O(e,t){let a=e?.preferred_name||e?.full_name||window._userProfile?.preferred_name||"",s=a?`Hei, ${o(a)}.`:"Hei.",i=o(R()),l=B(t);return`
    <header class="home-topbar">
      <div class="home-topbar__greet">
        <p class="home-topbar__hello">${s}</p>
        <p class="home-topbar__date">${i}</p>
      </div>
      ${l?`<div class="home-tabs" role="tablist" aria-label="Kielet">${l}</div>`:""}
    </header>`}function Y(e){return e==="fr"?`
      <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M20 180 C 20 130, 70 130, 70 90 S 120 50, 120 10"/>
          <path d="M60 180 C 60 130, 110 130, 110 90 S 160 50, 160 10"/>
          <path d="M100 180 C 100 130, 150 130, 150 90 S 200 50, 200 10"/>
          <path d="M140 180 C 140 130, 190 130, 190 90 S 240 50, 240 10"/>
          <circle cx="70" cy="90" r="6"/>
          <circle cx="110" cy="90" r="6"/>
          <circle cx="150" cy="90" r="6"/>
          <circle cx="190" cy="90" r="6"/>
          <path d="M0 180 L 240 180"/>
        </g>
      </svg>`:e==="de"?`
      <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="80" cy="100" r="60"/>
          <rect x="120" y="40" width="100" height="100"/>
          <path d="M30 180 L 90 80 L 150 180 Z"/>
        </g>
      </svg>`:`
    <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M20 170 L 20 100 A 30 36 0 0 1 80 100 L 80 170"/>
        <path d="M105 170 L 105 100 A 30 36 0 0 1 165 100 L 165 170"/>
        <path d="M190 170 L 190 100 A 30 36 0 0 1 250 100 L 250 170"/>
        <path d="M20 90 A 30 26 0 0 1 80 90"/>
        <path d="M105 90 A 30 26 0 0 1 165 90"/>
        <path d="M190 90 A 30 26 0 0 1 250 90"/>
        <path d="M0 170 L 240 170"/>
        <path d="M0 180 L 240 180" stroke-dasharray="6 6"/>
      </g>
    </svg>`}function U(e,t){let a=Number(e?.totalSessions??0),s=null;try{let r=sessionStorage.getItem("currentLesson")||localStorage.getItem("puheo:last-lesson");r&&(s=JSON.parse(r))}catch{}let i=$[t]||$.es,l=Math.min(7,Math.max(0,Math.floor(a/6))),u=i.courses[l],n=a===0&&!s,m=n?`${i.label} \xB7 Aloita t\xE4st\xE4`:`${i.label} \xB7 Kurssi ${u.num}`,c=n?`Aloita matka ${i.label.toLowerCase()}an`:u.title,k=n?"Yksi oppitunti per p\xE4iv\xE4 riitt\xE4\xE4. Aloitamme tutuilla sanoilla.":u.hook,p=n?"Aloita \u2192":"Jatka oppituntia \u2192";return`
    <a class="home-hero ${n?"is-fresh":""}"
       href="#/oppimispolku?lang=${o(t)}"
       data-action="continue"
       data-lang="${o(t)}">
      <div class="home-hero__body">
        <p class="home-hero__eyebrow">${o(m)}</p>
        <h2 class="home-hero__title">${o(c)}</h2>
        <p class="home-hero__sub">${o(k)}</p>
        <span class="home-hero__cta">
          <span class="home-hero__cta-label">${o(p)}</span>
        </span>
      </div>
      <div class="home-hero__art" aria-hidden="true">
        ${Y(t)}
      </div>
    </a>`}function G(e){let t=Number(e?.streak??0),a=window._userProfile||{},s=Number(a.preferred_session_length||H),i=new Date().toISOString().slice(0,10),u=(Array.isArray(e?.chartData)?e.chartData:[]).filter(I=>I?.createdAt?.slice(0,10)===i).length,n=Math.min(s,u*3),m=n>=s,c=46,k=2*Math.PI*c,p=Math.max(0,Math.min(1,n/s)),r=k*(1-p),d=t>=1?String(t):"0",f=t>=1?"pv putki":"aloita putki";return`
    <section class="home-streak ${m?"is-met":""} ${t===0?"is-empty":""}"
             aria-label="P\xE4iv\xE4n tavoite ja streak">
      <div class="home-streak__ring-wrap">
        <svg class="home-streak__ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle class="home-streak__track" cx="60" cy="60" r="${c}"
                  fill="none" stroke-width="8"/>
          <circle class="home-streak__fill" cx="60" cy="60" r="${c}"
                  fill="none" stroke-width="8"
                  stroke-linecap="round"
                  stroke-dasharray="${k}"
                  stroke-dashoffset="${r}"
                  transform="rotate(-90 60 60)"/>
        </svg>
        <div class="home-streak__center">
          <span class="home-streak__num" data-target="${t}">${d}</span>
          <span class="home-streak__unit">${f}</span>
        </div>
      </div>
      <div class="home-streak__meta">
        <p class="home-streak__minutes">
          <span class="home-streak__minutes-val">${n}</span>
          <span class="home-streak__minutes-sep">/</span>
          <span class="home-streak__minutes-goal">${s}</span>
          <span class="home-streak__minutes-unit">min t\xE4n\xE4\xE4n</span>
        </p>
      </div>
    </section>`}function J(e){let t=V(e);return`
    <section class="home-tip" aria-label="Vinkki p\xE4iv\xE4\xE4n">
      <p class="home-tip__eyebrow">Vinkki p\xE4iv\xE4\xE4n</p>
      <h3 class="home-tip__title">${o(t.title)}</h3>
      <p class="home-tip__body">${o(t.body)}</p>
      <a class="home-tip__more" href="#/oppimispolku?lang=${o(e)}">
        Lue lis\xE4\xE4
        <span class="home-tip__arrow" aria-hidden="true">\u2192</span>
      </a>
    </section>`}var _=[{id:"vocab",label:"Sanasto",sub:"Sanoja ja merkityksi\xE4",href:e=>`#/oppimispolku?lang=${e}`},{id:"grammar",label:"Kielioppi",sub:"Rakenteet ja muodot",href:e=>`#/oppimispolku?lang=${e}`},{id:"reading",label:"Luetun ymm\xE4rt\xE4minen",sub:"Tekstej\xE4 ja kysymyksi\xE4",href:e=>`#/luetun?lang=${e}`},{id:"writing",label:"Kirjoitus",sub:"Lyhyit\xE4 omia tekstej\xE4",href:e=>`#/kirjoitus?lang=${e}`}];function z(e,t){let a=e?.modeStats||{},s="vocab",i=-1;for(let r of _){let d=Number(a[r.id]?.sessions??0);d>i&&(i=d,s=r.id)}let l=_.find(r=>r.id===s),u=_.filter(r=>r.id!==s),n=Number(a[s]?.sessions??0),m=Math.max(0,Math.min(100,Math.round(n/30*100))),c=n===0?"Ei viel\xE4 aloitettu":`${n} ${n===1?"harjoitus":"harjoitusta"} kertynyt`,k=`
    <a class="home-mode home-mode--feature" href="${l.href(t)}" data-mode="${l.id}">
      <p class="home-mode__eyebrow">Vahvin reitti</p>
      <h3 class="home-mode__name">${o(l.label)}</h3>
      <p class="home-mode__sub">${o(l.sub)}</p>
      <div class="home-mode__bar" aria-hidden="true">
        <div class="home-mode__bar-fill" style="width:${m}%"></div>
      </div>
      <p class="home-mode__meta">${o(c)}</p>
    </a>`,p=u.map(r=>{let d=Number(a[r.id]?.sessions??0),f=d===0?"Ei aloitettu":`${d} harj.`;return`
      <a class="home-mode home-mode--mini" href="${r.href(t)}" data-mode="${r.id}">
        <h4 class="home-mode__name home-mode__name--mini">${o(r.label)}</h4>
        <p class="home-mode__meta home-mode__meta--mini">${o(f)}</p>
        <span class="home-mode__arrow" aria-hidden="true">\u2192</span>
      </a>`}).join("");return`
    <section class="home-modes" aria-label="Harjoitusreitit">
      <p class="home-modes__eyebrow">Harjoitusreitit</p>
      <div class="home-modes__grid">
        ${k}
        <div class="home-modes__minis">${p}</div>
      </div>
    </section>`}function Q(e,t){let a=t?"":'<span class="home-quick__lock" aria-hidden="true">\u{1F512}</span>';return`
    <nav class="home-quick" aria-label="Pikatoiminnot">
      <a class="home-quick__link" href="#/koeharjoitus?lang=${o(e)}" data-action="exam">
        ${a}Koeharjoitus
      </a>
      <span class="home-quick__sep" aria-hidden="true">\xB7</span>
      <a class="home-quick__link" href="#/asetukset?tab=kielet">Vaihda kielt\xE4</a>
      <span class="home-quick__sep" aria-hidden="true">\xB7</span>
      <a class="home-quick__link" href="#/asetukset">Asetukset</a>
    </nav>`}function A(e,t,a){let s=t?.dashboard||{},i=t?.profile?.profile||window._userProfile||null;return`
    <div class="home-v280">
      ${O(i,e)}
      <div class="home-band">
        <div class="home-band__main">${U(s,e)}</div>
        <aside class="home-band__rail">
          ${G(s)}
          ${J(e)}
        </aside>
      </div>
      ${z(s,e)}
      ${Q(e,a)}
    </div>
  `}function M(e){e.querySelectorAll(".home-tab").forEach(t=>{t.addEventListener("click",()=>{let a=t.dataset.lang;a&&(K(a),Z())})})}function L(e){e.querySelectorAll("[data-action='exam']").forEach(t=>{t.addEventListener("click",a=>{!(t.dataset.unlocked==="1")&&!window._isPro&&(a.preventDefault(),import("./app-paywallModal-DBYVV33A.js").then(i=>i.openPaywallModal?.()).catch(()=>{}))})})}function P(e){if(typeof window>"u")return;let t=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=e.querySelector(".home-streak__num");if(!a)return;let s=Number(a.dataset.target||a.textContent||0);if(!Number.isFinite(s)||s<=0)return;if(t){a.textContent=String(s);return}let i=performance.now(),l=Math.min(900,200+s*50);function u(n){let m=Math.min(1,(n-i)/l),c=1-Math.pow(1-m,4);a.textContent=String(Math.round(s*c)),m<1&&requestAnimationFrame(u)}a.textContent="0",requestAnimationFrame(u)}function E(e){if(typeof window>"u"||window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let a=e.querySelector(".home-streak__fill");if(!a)return;let s=a.getAttribute("stroke-dashoffset"),i=a.getAttribute("stroke-dasharray");a.style.transition="none",a.setAttribute("stroke-dashoffset",i),a.getBoundingClientRect(),a.style.transition="stroke-dashoffset 700ms cubic-bezier(0.23, 1, 0.32, 1)",requestAnimationFrame(()=>{a.setAttribute("stroke-dashoffset",s)})}function W(e){return`
    <div class="home-v280 home-v280--skel" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotin\xE4ytt\xF6\xE4\u2026</span>
      <header class="home-topbar" aria-hidden="true">
        <div class="home-topbar__greet">
          <span class="home-skel home-skel--hello"></span>
          <span class="home-skel home-skel--date"></span>
        </div>
      </header>
      <div class="home-band">
        <div class="home-band__main">
          <div class="home-hero home-hero--skel" aria-hidden="true">
            <div class="home-hero__body">
              <span class="home-skel home-skel--eyebrow"></span>
              <span class="home-skel home-skel--title"></span>
              <span class="home-skel home-skel--sub"></span>
              <span class="home-skel home-skel--cta"></span>
            </div>
          </div>
        </div>
        <aside class="home-band__rail" aria-hidden="true">
          <div class="home-streak home-streak--skel">
            <span class="home-skel home-skel--ring"></span>
          </div>
          <div class="home-tip home-tip--skel">
            <span class="home-skel home-skel--eyebrow"></span>
            <span class="home-skel home-skel--title"></span>
            <span class="home-skel home-skel--sub"></span>
          </div>
        </aside>
      </div>
    </div>`}async function Z(){w("screen-home");let e=document.getElementById("home-root");if(!e)return;let t=N();if(h&&Date.now()-h.ts<6e4){let i=h.payload,l=v(i?.profile?.profile);window._isPro=l,e.innerHTML=A(t,i,l),M(e),L(e),P(e),E(e);return}e.innerHTML=W(t);let a=await F(),s=v(a?.profile?.profile);window._isPro=s,e.innerHTML=A(t,a,s),M(e),L(e),P(e),E(e)}export{Z as loadHome};
//# sourceMappingURL=app-home-GSUHFMKL.js.map
