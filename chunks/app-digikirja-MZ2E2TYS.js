import{b as y}from"./app-chunk-AE7C6F2Z.js";import{b as I}from"./app-chunk-3WC2U67L.js";function D(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function _(e){let t=D(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function S(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function E(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(n=>n.trim())}function F(e,t){let n=E(e),s=t.map(E),i=n.map(l=>`<th>${_(l)}</th>`).join(""),a=s.map(l=>`<tr>${l.map(d=>`<td>${_(d)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${n.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${i}</tr></thead><tbody>${a}</tbody></table></div>`}function G(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(s=>s.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${_(s)}</p>`).join("")}</div>
    </aside>`}function Y(e){return`<ul class="dk__teoria-ul">${e.map(n=>`<li>${_(n.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function A(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),n=[],s=0,i=!1;for(;s<t.length;){let a=t[s];if(/^\s*$/.test(a)){s++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(a);if(r){let u=r[1].length,d=r[2].trim();if(u===1&&!i){i=!0,s++;continue}u===2?n.push(`<h3 class="dk__teoria-h2">${_(d)}</h3>`):u===3?n.push(`<h4 class="dk__teoria-h3">${_(d)}</h4>`):n.push(`<h${Math.min(u+1,6)} class="dk__teoria-h">${_(d)}</h${Math.min(u+1,6)}>`),s++;continue}if(/^\s*>\s?/.test(a)){let u=[];for(;s<t.length&&/^\s*>\s?/.test(t[s]);)u.push(t[s]),s++;n.push(G(u));continue}if(/^\s*\|/.test(a)&&s+1<t.length&&S(t[s+1])){let u=a,d=[];for(s+=2;s<t.length&&/^\s*\|/.test(t[s]);)d.push(t[s]),s++;n.push(F(u,d));continue}if(/^\s*[-*]\s+/.test(a)){let u=[];for(;s<t.length&&/^\s*[-*]\s+/.test(t[s]);)u.push(t[s]),s++;n.push(Y(u));continue}let l=[a];for(s++;s<t.length&&!/^\s*$/.test(t[s])&&!/^(#{1,6})\s+/.test(t[s])&&!/^\s*>\s?/.test(t[s])&&!/^\s*[-*]\s+/.test(t[s])&&!(/^\s*\|/.test(t[s])&&s+1<t.length&&S(t[s+1]));)l.push(t[s]),s++;n.push(`<p class="dk__teoria-p">${_(l.join(" "))}</p>`)}return n.join(`
`)}var B="puheo:dk:sidemenu",v="open",h="collapsed",z={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},j={teoria:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 5.5a1.5 1.5 0 0 1 1.5-1.5h5A2.5 2.5 0 0 1 13 6.5V20"/>
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4h-5A2.5 2.5 0 0 0 11 6.5V20"/>
    <path d="M4 5.5V19a1 1 0 0 0 1 1h5"/>
    <path d="M20 5.5V19a1 1 0 0 1-1 1h-5"/>
  </svg>`,tehtava:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="m18 2 4 4-9.5 9.5L8 17l1.5-4.5L18 2.5"/>
  </svg>`,flashcards:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3.5" y="6.5" width="13" height="11" rx="2"/>
    <path d="M7.5 4.5h11a2 2 0 0 1 2 2v9"/>
  </svg>`,testi:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
    <path d="m8.5 12.5 2.5 2.5 4.5-5"/>
  </svg>`,itsearviointi:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3.5 14.6 9l6 .55-4.55 4.05L17.4 20 12 16.9 6.6 20l1.35-6.4L3.4 9.55 9.4 9z"/>
  </svg>`};function W(e){return j[e]||j.tehtava}var T={flashcards:{label:"K\xE4\xE4nt\xF6kortit, tulossa PR 5",body:"Pino k\xE4\xE4ntyvi\xE4 kortteja oppitunnin sanastosta. Etupuoli: l\xE4hdekielinen virke. Takapuoli: suomi + s\xE4\xE4nt\xF6vihje. Tila per kortti (tied\xE4n / harjoittele viel\xE4) persistoituu localStorage:en, kirjautuneille Supabaseen."},testi:{label:"Testi, tulossa PR 6",body:"Sama ExerciseCard kuin teht\xE4v\xE4ll\xE4, mutta ilman live-palautetta per kohta. Opiskelija vastaa kaikkiin, painaa Tarkista, ja n\xE4kee yhteenvedon + per-kohta-palautteen."},itsearviointi:{label:"Itsearviointi, tulossa PR 7",body:"Lyhyt 1\u20135 asteikollinen lomake: hallitsen aiheen sanaston, tunnistan rakenteet, voin keskustella. Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa."}},O=!1,c={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},m=null,k=[],g="";function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function Z(){try{return localStorage.getItem(B)===h?h:v}catch{return v}}function J(e){try{localStorage.setItem(B,e)}catch{}}function Q(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function X(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function ee(e){let t=X(e),n=await fetch(t,{headers:{accept:"application/json"}});if(!n.ok)throw new Error(`lesson fetch ${n.status}`);return n.json()}function te(e){let t=[];return t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((s,i)=>{let a=String(i+1),r=s.title||`Vaihe ${a}`,l=Array.isArray(s.items)?s.items.length:0;t.push({id:`phase-${i}`,kind:"tehtava",num:a,title:r,meta:l?`${l} kohtaa`:"Teht\xE4v\xE4"})}),t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:"5 korttia"}),t.push({id:"test-1",kind:"testi",num:"T1",title:"Test \xB7 K\xE4\xE4nn\xE4",meta:"Pisteytys"}),t.push({id:"test-2",kind:"testi",num:"T2",title:"Test \xB7 Valitse oikea muoto",meta:"Pisteytys"}),t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function $(e){let t=k.findIndex(n=>n.id===e);return t>=0?t:0}function ne(){let e=m?.meta||{},t=e.course_key||c.kurssiKey||"",n=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${o(c.lang)}">${o(Q(c.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${o(c.lang)}/${encodeURIComponent(c.kurssiKey)}">${o(t)}</a>
      </nav>
      <h1 class="dk__title">${o(n)}</h1>
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
    </header>`}function se(){let e=[],t=null;for(let s of k){let i=z[s.kind]||"Muut";i!==t&&(e.push({title:i,items:[]}),t=i),e[e.length-1].items.push(s)}let n=e.map(s=>{let i=`<span class="dk__group-title">${o(s.title)}</span>`,a=s.items.map(r=>{let l=r.id===c.sivuId,u=r.num||"\xB7";return`
        <button type="button"
                class="dk__row${l?" is-active":""}"
                data-sivu="${o(r.id)}"
                data-kind="${o(r.kind)}"
                aria-current="${l?"page":"false"}"
                aria-label="${o(r.title)}">
          <span class="dk__row-glyph-wrap" aria-hidden="true">${W(r.kind)}</span>
          <span class="dk__row-num">${o(u)}</span>
          <span class="dk__row-title">${o(r.title)}</span>
          <span class="dk__row-meta">${o(r.meta||"")}</span>
        </button>`}).join("");return i+a}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${k.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function ie(){let e=m?.teaching||{},t=e.intro_md||"",n=Array.isArray(e.key_points)?e.key_points:[],s=A(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,i=n.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${n.map(a=>`<li>${o(a)}</li>`).join("")}</ol>
       </aside>`:"";return s+i}function K(e){let t=T[e.kind]||T.flashcards;return`
    <div class="dk__placeholder" data-kind="${o(e.kind)}">
      <p class="dk__placeholder-kind">${o(t.label)}</p>
      <p>${o(t.body)}</p>
    </div>`}var C=new Map,ae=new Set(["mc","typed","gap_fill","translate"]);function P(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let n=Number(t[1]);return(Array.isArray(m?.phases)?m.phases:[])[n]||null}function R(e,t){let n=C.get(e);return n||(n={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},C.set(e,n)),n}function H(e){let t=P(e);if(!t)return K(e);let n=Array.isArray(t.items)?t.items:[];if(n.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let s=n[0].item_type;if(!ae.has(s)){let u=s==="match"?"Yhdist\xE4misteht\xE4v\xE4, tulossa PR 4b":s==="writing"?"Kirjoitusteht\xE4v\xE4, tulossa PR 7":`Teht\xE4v\xE4tyyppi "${s}" tulossa my\xF6hemmin`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${o(u)}</p>
        <p>Vaihe ${o(String((re(e)??0)+1))}: ${o(t.title||"")}. Vaiheessa ${n.length} teht\xE4v\xE4\xE4 t\xE4t\xE4 tyyppi\xE4.</p>
      </div>`}let i=R(e.id,n),a=Math.min(i.itemIndex,n.length-1),r=n[a],l=i.answered[a];return`
    <section class="dk__exercise" data-sivu="${o(e.id)}" data-index="${a}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${a+1} / ${n.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${i.scoreCorrect} / ${i.scoreTotal}</span>
      </header>
      ${oe(r,l)}
      ${pe(r,l,a,n.length)}
    </section>`}function re(e){let t=/^phase-(\d+)$/.exec(e.id);return t?Number(t[1]):null}function oe(e,t){switch(e.item_type){case"mc":return le(e,t);case"typed":return ce(e,t);case"gap_fill":return de(e,t);case"translate":return ue(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${o(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function le(e,t){let n=Array.isArray(e.choices)?e.choices:[],s=Number.isInteger(e.correct_index)?e.correct_index:-1,i=!!t,a=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${o(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${n.map((r,l)=>{let u=i&&a===l,d=i&&l===s,p=["dk__choice"];return u&&d?p.push("is-correct"):u&&!d?p.push("is-wrong"):i&&d&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${l}"
                    ${i?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+l)}</span>
              <span class="dk__choice-text">${o(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function ce(e,t){let n=e.hint||"",s=t?.userAnswer||"",i=!!t;return`
    <p class="dk__exercise-stem">${o(e.prompt||"")}</p>
    ${n?`<p class="dk__exercise-hint">${o(n)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${o(s)}"
             ${i?"disabled":""}>
    </div>`}function de(e,t){let n=String(e.sentence_template||""),s=(n.match(/\{(\d+)\}/g)||[]).length,i=t?.userAnswer||new Array(s).fill(""),a=!!t,r=0,l=o(n).replace(/\{(\d+)\}/g,()=>{let d=i[r]||"",p=`dk-gap-${r}`;return r++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${o(d)}" ${a?"disabled":""}>`}),u=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(d=>`<li><span>${o(d)}</span></li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${l}</p>
    ${u}`}function ue(e,t){let n=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",s=t?.userAnswer||"",i=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${o(n)}</p>
    <p class="dk__exercise-stem">${o(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${i?"disabled":""}>${o(s)}</textarea>
    </div>`}function pe(e,t,n,s){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let i=t.correct,a=i?"is-correct":"is-wrong",r=i?"Oikein":"Viel\xE4 ei aivan",l=ke(e,t),u=n>=s-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${a}">${r}</span>
      ${l}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${u?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function ke(e,t){let n=he(e),s=n?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(n)}</p>`:"",i=e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:"",a=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${o(t.accentHint)}</p>`:"";return`${s}${a}${i}`}function he(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),n=Array.isArray(e.answers)?e.answers:[],s=0;return t.replace(/\{(\d+)\}/g,()=>{let i=n[s++];return Array.isArray(i)&&i[0]||"\u2014"})}default:return""}}function M(e,t){switch(e.item_type){case"mc":{let n=Number(t);return{correct:n===e.correct_index,choiceIndex:n}}case"typed":case"translate":{let n=String(t||"").trim(),s=Array.isArray(e.accept)?e.accept:[];for(let i of s){let a=y(n,i,c.lang||"es");if(a.ok)return{correct:!0,userAnswer:n,accentHint:a.hint||null}}return{correct:!1,userAnswer:n}}case"gap_fill":{let n=Array.isArray(t)?t:[],s=Array.isArray(e.answers)?e.answers:[],i=!0;for(let a=0;a<s.length;a++){let r=Array.isArray(s[a])?s[a]:[s[a]],l=String(n[a]||"").trim(),u=!1;for(let d of r)if(y(l,String(d),c.lang||"es").ok){u=!0;break}if(!u){i=!1;break}}return{correct:i,userAnswer:n}}default:return{correct:!1}}}function _e(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let n=t.querySelector("#dk-input");return n?n.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(n=>n.value);default:return null}}function b(){let e=$(c.sivuId),t=k[e],n=document.querySelector(".dk__content .dk__exercise");if(!n)return;let s=document.createElement("div");s.innerHTML=H(t),n.replaceWith(s.firstElementChild),N()}function N(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,n=k.find(d=>d.id===t),s=P(n);if(!s)return;let i=s.items||[],a=Number(e.dataset.index),r=i[a];if(!r)return;let l=R(t,i);e.querySelectorAll(".dk__choice").forEach(d=>{d.addEventListener("click",()=>{if(l.answered[a])return;let p=Number(d.dataset.choice),w=M(r,p);l.answered[a]=w,w.correct&&l.scoreCorrect++,l.scoreTotal++,b()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(l.answered[a])return;let d=_e(r),p=M(r,d);l.answered[a]=p,p.correct&&l.scoreCorrect++,l.scoreTotal++,b()}),e.querySelector("#dk-input")?.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&!l.answered[a]&&(d.preventDefault(),document.getElementById("dk-check")?.click())}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(a<i.length-1)l.itemIndex=a+1,b();else{let d=$(c.sivuId),p=k[d+1];p&&x(p.id)}})}function V(){let e=m?.meta||{},t=$(c.sivuId),n=k[t],s=t>0?k[t-1]:null,i=t<k.length-1?k[t+1]:null,a=[e.course_key||c.kurssiKey,`Oppitunti ${e.lesson_index||c.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=n.kind==="teoria"?`<em>${o(n.title)}</em>`:`${n.num?`${o(n.num)} \xB7 `:""}${o(n.title)}`,l=n.kind==="teoria"?ie():n.kind==="tehtava"?H(n):K(n);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${L(s,i,"top")}
      <p class="dk__page-meta">${o(a)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${l}
      ${L(s,i,"bottom")}
    </main>`}function L(e,t,n){let s=`dk__prevnext dk__prevnext--${n}`,i=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${o(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${o(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,a=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${o(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${o(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${s}">${i}${a}</div>`}function me(){return`
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
    </div>`}function ve(e){return`
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
            <p>${o(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${o(c.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function f(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let n=document.getElementById("dk-toggle-sidemenu");n&&n.setAttribute("aria-pressed",e===h?"true":"false")}function fe(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let n=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let i=n.dataset.sidemenu===v?h:v;f(i)}else{let i=n.dataset.sidemenu===h?v:h;f(i),J(i)}}),t?.addEventListener("click",()=>{f(h)})}function x(e){if(!e||e===c.sivuId||k.findIndex(r=>r.id===e)<0)return;c.sivuId=e;let n=`#/oppitunti/${c.lang}/${encodeURIComponent(c.kurssiKey)}/${c.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==n&&history.replaceState(null,"",n);let s=document.getElementById("dk-root");if(!s)return;let i=s.querySelector(".dk__sidemenu-list");i&&i.querySelectorAll(".dk__row").forEach(r=>{let l=r.dataset.sivu===e;r.classList.toggle("is-active",l),r.setAttribute("aria-current",l?"page":"false")});let a=s.querySelector(".dk__content");if(a){let r=document.createElement("div");r.innerHTML=V(),a.replaceWith(r.firstElementChild),U()}window.matchMedia("(max-width: 1023px)").matches&&f(h),q(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function ye(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&x(t.dataset.sivu)})}function q(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let n=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,n)}})}function U(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>x(e.dataset.sivu))}),N()}function ge(){O=!0}async function be(e={}){O||ge(),c.lang=e.lang||c.lang,c.kurssiKey=e.kurssiKey||c.kurssiKey,c.lessonIndex=Number(e.lessonIndex)||c.lessonIndex,c.sivuId=e.sivuId||c.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=me(),I("screen-digikirja");let n=`${c.lang}/${c.kurssiKey}/${c.lessonIndex}`;g=n;try{let s=await ee(c);if(g!==n)return;m=s,k=te(s),k.some(r=>r.id===c.sivuId)||(c.sivuId=k[0]?.id||"teoria");let a=window.matchMedia("(max-width: 1023px)").matches?h:Z();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${a}">
        ${ne()}
        <div class="dk__body">
          ${se()}
          ${V()}
        </div>
      </div>`,f(a),fe(),ye(),U(),q()}catch(s){if(g!==n)return;t.innerHTML=ve(s)}}function Se(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(be({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{ge as initDigikirja,be as showDigikirja,Se as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-MZ2E2TYS.js.map
