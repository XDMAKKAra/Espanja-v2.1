import{b as y}from"./app-chunk-3WC2U67L.js";function M(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function m(e){let t=M(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function g(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function f(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function C(e,t){let s=f(e),n=t.map(f),i=s.map(d=>`<th>${m(d)}</th>`).join(""),o=n.map(d=>`<tr>${d.map(k=>`<td>${m(k)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${i}</tr></thead><tbody>${o}</tbody></table></div>`}function L(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${m(n)}</p>`).join("")}</div>
    </aside>`}function O(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${m(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function $(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,i=!1;for(;n<t.length;){let o=t[n];if(/^\s*$/.test(o)){n++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(o);if(r){let u=r[1].length,k=r[2].trim();if(u===1&&!i){i=!0,n++;continue}u===2?s.push(`<h3 class="dk__teoria-h2">${m(k)}</h3>`):u===3?s.push(`<h4 class="dk__teoria-h3">${m(k)}</h4>`):s.push(`<h${Math.min(u+1,6)} class="dk__teoria-h">${m(k)}</h${Math.min(u+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(o)){let u=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)u.push(t[n]),n++;s.push(L(u));continue}if(/^\s*\|/.test(o)&&n+1<t.length&&g(t[n+1])){let u=o,k=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)k.push(t[n]),n++;s.push(C(u,k));continue}if(/^\s*[-*]\s+/.test(o)){let u=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)u.push(t[n]),n++;s.push(O(u));continue}let d=[o];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&g(t[n+1]));)d.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${m(d.join(" "))}</p>`)}return s.join(`
`)}var I="puheo:dk:sidemenu",_="open",p="collapsed",K={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},x={tehtava:{label:"Harjoitusteht\xE4v\xE4, tulossa PR 4",body:"T\xE4m\xE4n vaiheen teht\xE4v\xE4t (monivalinta, t\xE4ydennys, yhdist\xE4minen, k\xE4\xE4nn\xF6s) rendr\xF6id\xE4\xE4n t\xE4h\xE4n sivuun upotettuna. L\xE4hde: nykyinen lesson_M.json:n items-array; ExerciseCard kuluttaa item-tyypin ja pisteytt\xE4\xE4 suoraan."},flashcards:{label:"K\xE4\xE4nt\xF6kortit, tulossa PR 5",body:"Pino k\xE4\xE4ntyvi\xE4 kortteja oppitunnin sanastosta. Etupuoli: l\xE4hdekielinen virke. Takapuoli: suomi + s\xE4\xE4nt\xF6vihje. Tila per kortti (tied\xE4n / harjoittele viel\xE4) persistoituu localStorage:en, kirjautuneille Supabaseen."},testi:{label:"Testi, tulossa PR 6",body:"Sama ExerciseCard kuin teht\xE4v\xE4ll\xE4, mutta ilman live-palautetta per kohta. Opiskelija vastaa kaikkiin, painaa Tarkista, ja n\xE4kee yhteenvedon + per-kohta-palautteen."},itsearviointi:{label:"Itsearviointi, tulossa PR 7",body:"Lyhyt 1\u20135 asteikollinen lomake: hallitsen aiheen sanaston, tunnistan rakenteet, voin keskustella. Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa."}},S=!1,a={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},v=null,c=[],b="";function l(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function R(){try{return localStorage.getItem(I)===p?p:_}catch{return _}}function P(e){try{localStorage.setItem(I,e)}catch{}}function A(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function B(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function U(e){let t=B(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}function H(e){let t=[];return t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((n,i)=>{let o=String(i+1),r=n.title||`Vaihe ${o}`,d=Array.isArray(n.items)?n.items.length:0;t.push({id:`phase-${i}`,kind:"tehtava",num:o,title:r,meta:d?`${d} kohtaa`:"Teht\xE4v\xE4"})}),t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:"5 korttia"}),t.push({id:"test-1",kind:"testi",num:"T1",title:"Test \xB7 K\xE4\xE4nn\xE4",meta:"Pisteytys"}),t.push({id:"test-2",kind:"testi",num:"T2",title:"Test \xB7 Valitse oikea muoto",meta:"Pisteytys"}),t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function D(e){let t=c.findIndex(s=>s.id===e);return t>=0?t:0}function N(){let e=v?.meta||{},t=e.course_key||a.kurssiKey||"",s=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${l(a.lang)}">${l(A(a.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${l(a.lang)}/${encodeURIComponent(a.kurssiKey)}">${l(t)}</a>
      </nav>
      <h1 class="dk__title">${l(s)}</h1>
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
    </header>`}function q(){let e=[],t=null;for(let n of c){let i=K[n.kind]||"Muut";i!==t&&(e.push({title:i,items:[]}),t=i),e[e.length-1].items.push(n)}let s=e.map(n=>{let i=`<span class="dk__group-title">${l(n.title)}</span>`,o=n.items.map(r=>{let d=r.id===a.sivuId,u=r.num||"\xB7";return`
        <button type="button"
                class="dk__row${d?" is-active":""}"
                data-sivu="${l(r.id)}"
                aria-current="${d?"page":"false"}">
          <span class="dk__row-num">${l(u)}</span>
          <span class="dk__row-title">${l(r.title)}</span>
          <span class="dk__row-meta">${l(r.meta||"")}</span>
        </button>`}).join("");return i+o}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${c.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${s}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function V(){let e=v?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=$(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,i=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(o=>`<li>${l(o)}</li>`).join("")}</ol>
       </aside>`:"";return n+i}function G(e){let t=x[e.kind]||x.tehtava;return`
    <div class="dk__placeholder" data-kind="${l(e.kind)}">
      <p class="dk__placeholder-kind">${l(t.label)}</p>
      <p>${l(t.body)}</p>
    </div>`}function E(){let e=v?.meta||{},t=D(a.sivuId),s=c[t],n=t>0?c[t-1]:null,i=t<c.length-1?c[t+1]:null,o=[e.course_key||a.kurssiKey,`Oppitunti ${e.lesson_index||a.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=s.kind==="teoria"?`<em>${l(s.title)}</em>`:`${s.num?`${l(s.num)} \xB7 `:""}${l(s.title)}`,d=s.kind==="teoria"?V():G(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${w(n,i,"top")}
      <p class="dk__page-meta">${l(o)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${d}
      ${w(n,i,"bottom")}
    </main>`}function w(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,i=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${l(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${l(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,o=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${l(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${l(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${n}">${i}${o}</div>`}function z(){return`
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <span></span>
        <span class="dk__title" style="font-style: normal; color: var(--ed-ink-muted);">Ladataan oppituntia\u2026</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"><div class="dk__sidemenu-head"><span class="dk__sidemenu-eyebrow">Sis\xE4llys</span></div></aside>
        <main class="dk__content">
          <div class="dk__loading">Haetaan oppituntia palvelimelta\u2026</div>
        </main>
      </div>
    </div>`}function F(e){return`
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <nav class="dk__breadcrumb">
          <a href="#/aloitus">Etusivu</a>
        </nav>
        <span class="dk__title">Oppitunti ei latautunut</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"></aside>
        <main class="dk__content">
          <div class="dk__error">
            <strong>Oppituntia ei l\xF6ytynyt.</strong>
            <p>${l(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${l(a.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function h(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===p?"true":"false")}function W(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let i=s.dataset.sidemenu===_?p:_;h(i)}else{let i=s.dataset.sidemenu===p?_:p;h(i),P(i)}}),t?.addEventListener("click",()=>{h(p)})}function j(e){if(!e||e===a.sivuId||c.findIndex(r=>r.id===e)<0)return;a.sivuId=e;let s=`#/oppitunti/${a.lang}/${encodeURIComponent(a.kurssiKey)}/${a.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let i=n.querySelector(".dk__sidemenu-list");i&&i.querySelectorAll(".dk__row").forEach(r=>{let d=r.dataset.sivu===e;r.classList.toggle("is-active",d),r.setAttribute("aria-current",d?"page":"false")});let o=n.querySelector(".dk__content");if(o){let r=document.createElement("div");r.innerHTML=E(),o.replaceWith(r.firstElementChild),T()}window.matchMedia("(max-width: 1023px)").matches&&h(p),document.getElementById("dk-content")?.focus({preventScroll:!1})}function Y(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&j(t.dataset.sivu)})}function T(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>j(e.dataset.sivu))})}function Z(){S=!0}async function J(e={}){S||Z(),a.lang=e.lang||a.lang,a.kurssiKey=e.kurssiKey||a.kurssiKey,a.lessonIndex=Number(e.lessonIndex)||a.lessonIndex,a.sivuId=e.sivuId||a.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=z(),y("screen-digikirja");let s=`${a.lang}/${a.kurssiKey}/${a.lessonIndex}`;b=s;try{let n=await U(a);if(b!==s)return;v=n,c=H(n),c.some(r=>r.id===a.sivuId)||(a.sivuId=c[0]?.id||"teoria");let o=window.matchMedia("(max-width: 1023px)").matches?p:R();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${o}">
        ${N()}
        <div class="dk__body">
          ${q()}
          ${E()}
        </div>
      </div>`,h(o),W(),Y(),T()}catch(n){if(b!==s)return;t.innerHTML=F(n)}}function et(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(J({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{Z as initDigikirja,J as showDigikirja,et as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-PYFCRG6V.js.map
