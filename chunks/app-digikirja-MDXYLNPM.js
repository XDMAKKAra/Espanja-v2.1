import{b as v}from"./app-chunk-3WC2U67L.js";var h="puheo:dk:sidemenu",k="open",u="collapsed",o={meta:{lang:"es",kurssiKey:"kurssi-2",kurssiTitle:"YO Espanja kertaus",lessonIndex:3,lessonTitle:"Subjuntiivi",printedPages:"s. 191\u2013194"},sivut:[{id:"teoria",kind:"teoria",num:"",title:"Subjuntiivi",meta:"Opetussivu"},{id:"1",kind:"tehtava",num:"1",title:"Muodosta verbimuotoja",meta:"Drilli"},{id:"2a",kind:"tehtava",num:"2a",title:"Yhdist\xE4 lauseenosat",meta:"Yhdist\xE4"},{id:"2b",kind:"tehtava",num:"2b",title:"T\xE4ydenn\xE4 subjuntiivilla",meta:"T\xE4ydenn\xE4"},{id:"3",kind:"tehtava",num:"3",title:"K\xE4\xE4nn\xE4 suomesta espanjaksi",meta:"K\xE4\xE4nn\xE4"},{id:"kortit-1",kind:"flashcards",num:"",title:"K\xE4\xE4nt\xF6kortit \xB7 Subjuntiivin liipaisimet",meta:"5 korttia"},{id:"test-1a",kind:"testi",num:"T1",title:"Test 1a \xB7 K\xE4\xE4nn\xE4",meta:"Pisteytys"},{id:"test-2",kind:"testi",num:"T2",title:"Test 2 \xB7 Valitse oikea muoto",meta:"Pisteytys"},{id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}]},$={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},_={teoria:{label:"Teoriasivu \u2014 tulossa PR 2",body:"Subjuntiivin peruss\xE4\xE4nn\xF6t, k\xE4ytt\xF6tilanteet, ja indikatiivi/subjuntiivi-vertailu kaksikielisin\xE4 taulukoina. Pieni Obs!-laatikko yleisimmille poikkeuksille (verbit jotka pakottavat subjuntiivin: querer que, esperar que, dudar que, no creer que). PR 2 vie sis\xE4ll\xF6n nykyisist\xE4 lesson_M.json:in teaching-kentist\xE4 t\xE4h\xE4n."},tehtava:{label:"Harjoitusteht\xE4v\xE4 \u2014 tulossa PR 4",body:"Yksitt\xE4inen drill / yhdist\xE4 / t\xE4ydenn\xE4 / k\xE4\xE4nn\xE4 -teht\xE4v\xE4. Render\xF6inti tulee lessonRunnerist\xE4 mutta upotettuna t\xE4h\xE4n sivuun (ei modaali, ei screen-swap). L\xE4hde: nykyinen lesson_M.json:in items-array; PR 4 mappaa item-tyypin (multiple-choice, fill-blank, \u2026) t\xE4m\xE4n sivun teht\xE4v\xE4ksi."},flashcards:{label:"K\xE4\xE4nt\xF6kortit \u2014 tulossa PR 5",body:"Pino k\xE4\xE4ntyvi\xE4 kortteja (etupuoli: l\xE4hdekielinen virke, takapuoli: suomi + s\xE4\xE4nt\xF6). Tila per kortti: \u201Dtied\xE4n\u201D / \u201Dharjoittele viel\xE4\u201D, persistoitu localStorage:en + Supabaseen kirjautuneille."},testi:{label:"Testi \u2014 tulossa PR 6",body:"Sama UI kuin teht\xE4v\xE4ll\xE4, mutta ilman live-feedbackia per kohta. K\xE4ytt\xE4j\xE4 vastaa kaikkiin, painaa \u201DTarkista\u201D ja n\xE4kee lopputuloksen + per-kohta-palautteen."},itsearviointi:{label:"Itsearviointi \u2014 tulossa PR 7",body:"4\u20135 v\xE4itt\xE4m\xE4\xE4 1\u20135-asteikolla (\u201DHallitsen subjuntiivin peruss\xE4\xE4nn\xF6t\u201D, \u201DTunnistan liipaisinverbit\u201D, \u2026). Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa."}},y=!1,c={lang:"es",kurssiKey:"kurssi-2",lessonIndex:3,sivuId:"teoria"};function I(){try{return localStorage.getItem(h)===u?u:k}catch{return k}}function S(t){try{localStorage.setItem(h,t)}catch{}}function i(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function j(t){let e=o.sivut.findIndex(n=>n.id===t);return e>=0?e:0}function E(){let{meta:t}=o,e=t.lang==="es"?"Espanja":t.lang==="fr"?"Ranska":"Saksa";return`
    <header class="dk__topbar" role="banner">
      <button type="button" class="dk__tool" id="dk-toggle-sidemenu"
              aria-label="Avaa tai sulje sis\xE4llysluettelo"
              aria-pressed="false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="14" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
      <nav class="dk__breadcrumb" aria-label="Navigointi">
        <a href="#/aloitus">Etusivu</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku?lang=${i(t.lang)}">${i(e)}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${i(t.lang)}/${encodeURIComponent(t.kurssiKey)}">${i(t.kurssiTitle)}</a>
      </nav>
      <h1 class="dk__title">${i(t.lessonTitle)}</h1>
      <div class="dk__tools">
        <button type="button" class="dk__tool" id="dk-search" aria-label="Etsi" title="Etsi (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
        </button>
        <button type="button" class="dk__tool" id="dk-help" aria-label="Opas" title="Opas (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2"/>
            <circle cx="12" cy="17" r="0.5"/>
          </svg>
        </button>
      </div>
    </header>`}function w(){let t=[],e=null;for(let a of o.sivut){let s=$[a.kind]||"Muut";s!==e&&(t.push({title:s,items:[]}),e=s),t[t.length-1].items.push(a)}let n=t.map(a=>{let s=`<span class="dk__group-title">${i(a.title)}</span>`,r=a.items.map(d=>{let l=d.id===c.sivuId,m=d.num||"\xB7";return`
        <button type="button"
                class="dk__row${l?" is-active":""}"
                data-sivu="${i(d.id)}"
                aria-current="${l?"page":"false"}">
          <span class="dk__row-num">${i(m)}</span>
          <span class="dk__row-title">${i(d.title)}</span>
          <span class="dk__row-meta">${i(d.meta||"")}</span>
        </button>`}).join("");return s+r}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${o.sivut.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function g(){let{meta:t}=o,e=j(c.sivuId),n=o.sivut[e],a=e>0?o.sivut[e-1]:null,s=e<o.sivut.length-1?o.sivut[e+1]:null,r=_[n.kind]||_.tehtava,d=n.kind==="teoria"?`<em>${i(n.title)}</em>`:`${n.num?`${i(n.num)} \xB7 `:""}${i(n.title)}`;return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${b(a,s,"top")}
      <p class="dk__page-meta">${i(t.kurssiTitle)} \xB7 Oppitunti ${i(String(t.lessonIndex))} \xB7 ${i(t.printedPages)}</p>
      <h2 class="dk__page-title">${d}</h2>
      <div class="dk__placeholder" data-kind="${i(n.kind)}">
        <p class="dk__placeholder-kind">${i(r.label)}</p>
        <p>${i(r.body)}</p>
      </div>
      ${b(a,s,"bottom")}
    </main>`}function b(t,e,n){let a=`dk__prevnext dk__prevnext--${n}`,s=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${i(t.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${i(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,r=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${i(e.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${i(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${a}">${s}${r}</div>`}function p(t){let e=document.getElementById("dk-root");if(!e)return;e.dataset.sidemenu=t;let n=document.getElementById("dk-toggle-sidemenu");n&&n.setAttribute("aria-pressed",t===u?"true":"false")}function T(){let t=document.getElementById("dk-toggle-sidemenu"),e=document.getElementById("dk-sidemenu-backdrop");t?.addEventListener("click",()=>{let n=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let s=n.dataset.sidemenu===k?u:k;p(s)}else{let s=n.dataset.sidemenu===u?k:u;p(s),S(s)}}),e?.addEventListener("click",()=>{p(u)})}function f(t){if(!t||t===c.sivuId||o.sivut.findIndex(l=>l.id===t)<0)return;c.sivuId=t;let{meta:n}=o,a=`#/oppitunti/${n.lang}/${encodeURIComponent(n.kurssiKey)}/${n.lessonIndex}/${encodeURIComponent(t)}`;location.hash!==a&&history.replaceState(null,"",a);let s=document.getElementById("dk-root");if(!s)return;let r=s.querySelector(".dk__sidemenu-list");r&&r.querySelectorAll(".dk__row").forEach(l=>{let m=l.dataset.sivu===t;l.classList.toggle("is-active",m),l.setAttribute("aria-current",m?"page":"false")});let d=s.querySelector(".dk__content");if(d){let l=document.createElement("div");l.innerHTML=g(),d.replaceWith(l.firstElementChild),x()}window.matchMedia("(max-width: 1023px)").matches&&p(u),document.getElementById("dk-content")?.focus({preventScroll:!1})}function P(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",t=>{let e=t.target.closest(".dk__row");e&&f(e.dataset.sivu)})}function x(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(t=>{t.addEventListener("click",()=>f(t.dataset.sivu))})}function R(){y=!0}function M(t={}){y||R(),c.lang=t.lang||o.meta.lang,c.kurssiKey=t.kurssiKey||o.meta.kurssiKey,c.lessonIndex=Number(t.lessonIndex)||o.meta.lessonIndex,c.sivuId=t.sivuId&&o.sivut.some(s=>s.id===t.sivuId)?t.sivuId:o.sivut[0].id;let e=document.getElementById("screen-digikirja");if(!e)return;let a=window.matchMedia("(max-width: 1023px)").matches?u:I();e.innerHTML=`
    <div class="dk" id="dk-root" data-sidemenu="${a}">
      ${E()}
      <div class="dk__body">
        ${w()}
        ${g()}
      </div>
    </div>`,p(a),T(),P(),x(),v("screen-digikirja")}function L(t){let e=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(t||location.hash);return e?(M({lang:e[1].toLowerCase(),kurssiKey:decodeURIComponent(e[2]),lessonIndex:Number(e[3]),sivuId:decodeURIComponent(e[4])}),!0):!1}export{R as initDigikirja,M as showDigikirja,L as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-MDXYLNPM.js.map
