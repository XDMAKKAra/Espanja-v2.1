import{b as w}from"./app-chunk-AE7C6F2Z.js";import{b as T}from"./app-chunk-3WC2U67L.js";function ie(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function f(e){let t=ie(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function M(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function B(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(n=>n.trim())}function re(e,t){let n=B(e),s=t.map(B),a=n.map(c=>`<th>${f(c)}</th>`).join(""),i=s.map(c=>`<tr>${c.map(l=>`<td>${f(l)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${n.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function oe(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(s=>s.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${f(s)}</p>`).join("")}</div>
    </aside>`}function ce(e){return`<ul class="dk__teoria-ul">${e.map(n=>`<li>${f(n.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function K(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),n=[],s=0,a=!1;for(;s<t.length;){let i=t[s];if(/^\s*$/.test(i)){s++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(i);if(r){let d=r[1].length,l=r[2].trim();if(d===1&&!a){a=!0,s++;continue}d===2?n.push(`<h3 class="dk__teoria-h2">${f(l)}</h3>`):d===3?n.push(`<h4 class="dk__teoria-h3">${f(l)}</h4>`):n.push(`<h${Math.min(d+1,6)} class="dk__teoria-h">${f(l)}</h${Math.min(d+1,6)}>`),s++;continue}if(/^\s*>\s?/.test(i)){let d=[];for(;s<t.length&&/^\s*>\s?/.test(t[s]);)d.push(t[s]),s++;n.push(oe(d));continue}if(/^\s*\|/.test(i)&&s+1<t.length&&M(t[s+1])){let d=i,l=[];for(s+=2;s<t.length&&/^\s*\|/.test(t[s]);)l.push(t[s]),s++;n.push(re(d,l));continue}if(/^\s*[-*]\s+/.test(i)){let d=[];for(;s<t.length&&/^\s*[-*]\s+/.test(t[s]);)d.push(t[s]),s++;n.push(ce(d));continue}let c=[i];for(s++;s<t.length&&!/^\s*$/.test(t[s])&&!/^(#{1,6})\s+/.test(t[s])&&!/^\s*>\s?/.test(t[s])&&!/^\s*[-*]\s+/.test(t[s])&&!(/^\s*\|/.test(t[s])&&s+1<t.length&&M(t[s+1]));)c.push(t[s]),s++;n.push(`<p class="dk__teoria-p">${f(c.join(" "))}</p>`)}return n.join(`
`)}var F="puheo:dk:sidemenu",v="open",_="collapsed",de={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},H={teoria:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  </svg>`};function le(e){return H[e]||H.tehtava}var D=5,ue="puheo:dk:flashcards",O={testi:{label:"Testi, tulossa PR 6",body:"Sama ExerciseCard kuin teht\xE4v\xE4ll\xE4, mutta ilman live-palautetta per kohta. Opiskelija vastaa kaikkiin, painaa Tarkista, ja n\xE4kee yhteenvedon + per-kohta-palautteen."},itsearviointi:{label:"Itsearviointi, tulossa PR 7",body:"Lyhyt 1\u20135 asteikollinen lomake: hallitsen aiheen sanaston, tunnistan rakenteet, voin keskustella. Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa."}},q=!1,u={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},h=null,k=[],I="";function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function pe(){try{return localStorage.getItem(F)===_?_:v}catch{return v}}function ke(e){try{localStorage.setItem(F,e)}catch{}}function _e(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function he(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function fe(e){let t=he(e),n=await fetch(t,{headers:{accept:"application/json"}});if(!n.ok)throw new Error(`lesson fetch ${n.status}`);return n.json()}function me(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((i,r)=>{let c=String(r+1),d=i.title||`Vaihe ${c}`,l=Array.isArray(i.items)?i.items.length:0;t.push({id:`phase-${r}`,kind:"tehtava",num:c,title:d,meta:l?`${l} kohtaa`:"Teht\xE4v\xE4"})});let s=Array.isArray(e?.vocab)?e.vocab:[],a=Math.min(s.length,D);return a>0&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${a} korttia`}),t.push({id:"test-1",kind:"testi",num:"T1",title:"Test \xB7 K\xE4\xE4nn\xE4",meta:"Pisteytys"}),t.push({id:"test-2",kind:"testi",num:"T2",title:"Test \xB7 Valitse oikea muoto",meta:"Pisteytys"}),t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function $(e){let t=k.findIndex(n=>n.id===e);return t>=0?t:0}function ve(){let e=h?.meta||{},t=e.course_key||u.kurssiKey||"",n=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${o(u.lang)}">${o(_e(u.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${o(u.lang)}/${encodeURIComponent(u.kurssiKey)}">${o(t)}</a>
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
    </header>`}function ye(){let e=[],t=null;for(let s of k){let a=de[s.kind]||"Muut";a!==t&&(e.push({title:a,items:[]}),t=a),e[e.length-1].items.push(s)}let n=e.map(s=>{let a=`<span class="dk__group-title">${o(s.title)}</span>`,i=s.items.map(r=>{let c=r.id===u.sivuId,d=r.num||"\xB7";return`
        <button type="button"
                class="dk__row${c?" is-active":""}"
                data-sivu="${o(r.id)}"
                data-kind="${o(r.kind)}"
                aria-current="${c?"page":"false"}"
                aria-label="${o(r.title)}">
          <span class="dk__row-glyph-wrap" aria-hidden="true">${le(r.kind)}</span>
          <span class="dk__row-num">${o(d)}</span>
          <span class="dk__row-title">${o(r.title)}</span>
          <span class="dk__row-meta">${o(r.meta||"")}</span>
        </button>`}).join("");return a+i}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${k.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function ge(){let e=h?.teaching||{},t=e.intro_md||"",n=Array.isArray(e.key_points)?e.key_points:[],s=K(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=n.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${n.map(i=>`<li>${o(i)}</li>`).join("")}</ol>
       </aside>`:"";return s+a}function V(e){let t=O[e.kind]||O.flashcards;return`
    <div class="dk__placeholder" data-kind="${o(e.kind)}">
      <p class="dk__placeholder-kind">${o(t.label)}</p>
      <p>${o(t.body)}</p>
    </div>`}var A=new Map,g="know",U="again";function C(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,D)}function j(){return`${ue}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function L(){try{let e=localStorage.getItem(j());return e?JSON.parse(e):{}}catch{return{}}}function be(e,t){try{let n=L();n[e]=t,localStorage.setItem(j(),JSON.stringify(n))}catch{}}function $e(){try{localStorage.removeItem(j())}catch{}}function Y(e){let t=A.get(e);return t||(t={cardIndex:0,flipped:!1},A.set(e,t)),t}function b(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function G(e){let t=C(h);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let n=L(),s=t.filter((se,ae)=>n[b(se,ae)]===g).length;if(s===t.length)return`
      <section class="dk__flashpack" data-sivu="${o(e.id)}" data-done="true">
        <header class="dk__exercise-head">
          <span class="dk__exercise-eyebrow">K\xE4\xE4nt\xF6kortit</span>
          <span class="dk__exercise-score">${s} / ${t.length}</span>
        </header>
        <div class="dk__flashdone">
          <p class="dk__flashdone-headline">Pakka k\xE4yty l\xE4pi.</p>
          <p class="dk__flashdone-sub">Voit palata kortteihin my\xF6hemmin, tai nollata edistymisesi ja harjoitella uudelleen.</p>
          <div class="dk__exercise-actions">
            <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-reset">Aloita alusta</button>
            <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-next-sivu">Seuraava sivu \u2192</button>
          </div>
        </div>
      </section>`;let i=Y(e.id),r=Math.min(i.cardIndex,t.length-1),d=W(t,n,r)[0]??r,l=t[d],p=b(l,d),m=n[p]||null;return`
    <section class="dk__flashpack" data-sivu="${o(e.id)}" data-index="${d}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${d+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${s} / ${t.length} hallinnassa</span>
      </header>
      ${xe(l,p,i.flipped,m)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function W(e,t,n){let s=[];for(let a=n;a<e.length;a++){let i=b(e[a],a);t[i]!==g&&s.push(a)}for(let a=0;a<n;a++){let i=b(e[a],a);t[i]!==g&&s.push(a)}return s}function xe(e,t,n,s){let a=e.gender?`<span class="dk__flashcard-tag">${o(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=s===U?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':s===g?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${n?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${o(t)}"
         aria-pressed="${n?"true":"false"}"
         aria-label="${o(n?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${a}${i}
          </div>
          <p class="dk__flashcard-word">${o(e.es||"")}</p>
          <p class="dk__flashcard-hint-pad">Yrit\xE4 muistaa, sitten k\xE4\xE4nn\xE4.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${i}
          </div>
          <p class="dk__flashcard-word">${o(e.fi||"")}</p>
          ${e.example_es?`<p class="dk__flashcard-example"><span lang="es">${o(e.example_es)}</span></p>`:""}
          ${e.example_fi?`<p class="dk__flashcard-example dk__flashcard-example--fi">${o(e.example_fi)}</p>`:""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${n?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${n?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${n?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function S(){let e=$(u.sivuId),t=k[e],n=document.querySelector(".dk__content .dk__flashpack");if(!n)return;let s=document.createElement("div");s.innerHTML=G(t),n.replaceWith(s.firstElementChild),z()}function z(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{$e(),A.delete(t),S()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let d=$(u.sivuId),l=k[d+1];l&&x(l.id)}),e.dataset.done==="true")return;let n=Y(t),s=Number(e.dataset.index),a=C(h)[s];if(!a)return;let i=b(a,s),r=()=>{n.flipped=!n.flipped,S()};document.getElementById("dk-flashcard")?.addEventListener("click",r),document.getElementById("dk-flashcard")?.addEventListener("keydown",d=>{(d.key===" "||d.key==="Enter")&&(d.preventDefault(),r())}),document.getElementById("dk-flash-flip")?.addEventListener("click",r);let c=d=>{be(i,d),n.flipped=!1;let l=L(),p=C(h),m=W(p,l,s+1<p.length?s+1:0);n.cardIndex=m[0]??s,S()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>c(U)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>c(g))}var R=new Map,we=new Set(["mc","typed","gap_fill","translate"]);function J(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let n=Number(t[1]);return(Array.isArray(h?.phases)?h.phases:[])[n]||null}function Z(e,t){let n=R.get(e);return n||(n={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},R.set(e,n)),n}function X(e){let t=J(e);if(!t)return V(e);let n=Array.isArray(t.items)?t.items:[];if(n.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let s=n[0].item_type;if(!we.has(s)){let d=s==="match"?"Yhdist\xE4misteht\xE4v\xE4, tulossa PR 4b":s==="writing"?"Kirjoitusteht\xE4v\xE4, tulossa PR 7":`Teht\xE4v\xE4tyyppi "${s}" tulossa my\xF6hemmin`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${o(d)}</p>
        <p>Vaihe ${o(String((Ie(e)??0)+1))}: ${o(t.title||"")}. Vaiheessa ${n.length} teht\xE4v\xE4\xE4 t\xE4t\xE4 tyyppi\xE4.</p>
      </div>`}let a=Z(e.id,n),i=Math.min(a.itemIndex,n.length-1),r=n[i],c=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${o(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${n.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>
      </header>
      ${Se(r,c)}
      ${Le(r,c,i,n.length)}
    </section>`}function Ie(e){let t=/^phase-(\d+)$/.exec(e.id);return t?Number(t[1]):null}function Se(e,t){switch(e.item_type){case"mc":return Ee(e,t);case"typed":return Ae(e,t);case"gap_fill":return Ce(e,t);case"translate":return je(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${o(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function Ee(e,t){let n=Array.isArray(e.choices)?e.choices:[],s=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${o(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${n.map((r,c)=>{let d=a&&i===c,l=a&&c===s,p=["dk__choice"];return d&&l?p.push("is-correct"):d&&!l?p.push("is-wrong"):a&&l&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${c}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+c)}</span>
              <span class="dk__choice-text">${o(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function Ae(e,t){let n=e.hint||"",s=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-stem">${o(e.prompt||"")}</p>
    ${n?`<p class="dk__exercise-hint">${o(n)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${o(s)}"
             ${a?"disabled":""}>
    </div>`}function Ce(e,t){let n=String(e.sentence_template||""),s=(n.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(s).fill(""),i=!!t,r=0,c=o(n).replace(/\{(\d+)\}/g,()=>{let l=a[r]||"",p=`dk-gap-${r}`;return r++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${o(l)}" ${i?"disabled":""}>`}),d=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(l=>`<li><span>${o(l)}</span></li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${c}</p>
    ${d}`}function je(e,t){let n=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",s=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${o(n)}</p>
    <p class="dk__exercise-stem">${o(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${o(s)}</textarea>
    </div>`}function Le(e,t,n,s){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",r=a?"Oikein":"Viel\xE4 ei aivan",c=Te(e,t),d=n>=s-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${r}</span>
      ${c}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${d?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function Te(e,t){let n=Me(e),s=n?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(n)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${o(t.accentHint)}</p>`:"";return`${s}${i}${a}`}function Me(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),n=Array.isArray(e.answers)?e.answers:[],s=0;return t.replace(/\{(\d+)\}/g,()=>{let a=n[s++];return Array.isArray(a)&&a[0]||"\u2014"})}default:return""}}function P(e,t){switch(e.item_type){case"mc":{let n=Number(t);return{correct:n===e.correct_index,choiceIndex:n}}case"typed":case"translate":{let n=String(t||"").trim(),s=Array.isArray(e.accept)?e.accept:[];for(let a of s){let i=w(n,a,u.lang||"es");if(i.ok)return{correct:!0,userAnswer:n,accentHint:i.hint||null}}return{correct:!1,userAnswer:n}}case"gap_fill":{let n=Array.isArray(t)?t:[],s=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<s.length;i++){let r=Array.isArray(s[i])?s[i]:[s[i]],c=String(n[i]||"").trim(),d=!1;for(let l of r)if(w(c,String(l),u.lang||"es").ok){d=!0;break}if(!d){a=!1;break}}return{correct:a,userAnswer:n}}default:return{correct:!1}}}function Be(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let n=t.querySelector("#dk-input");return n?n.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(n=>n.value);default:return null}}function E(){let e=$(u.sivuId),t=k[e],n=document.querySelector(".dk__content .dk__exercise");if(!n)return;let s=document.createElement("div");s.innerHTML=X(t),n.replaceWith(s.firstElementChild),Q()}function Q(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,n=k.find(l=>l.id===t),s=J(n);if(!s)return;let a=s.items||[],i=Number(e.dataset.index),r=a[i];if(!r)return;let c=Z(t,a);e.querySelectorAll(".dk__choice").forEach(l=>{l.addEventListener("click",()=>{if(c.answered[i])return;let p=Number(l.dataset.choice),m=P(r,p);c.answered[i]=m,m.correct&&c.scoreCorrect++,c.scoreTotal++,E()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(c.answered[i])return;let l=Be(r),p=P(r,l);c.answered[i]=p,p.correct&&c.scoreCorrect++,c.scoreTotal++,E()}),e.querySelector("#dk-input")?.addEventListener("keydown",l=>{l.key==="Enter"&&!l.shiftKey&&!c.answered[i]&&(l.preventDefault(),document.getElementById("dk-check")?.click())}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)c.itemIndex=i+1,E();else{let l=$(u.sivuId),p=k[l+1];p&&x(p.id)}})}function ee(){let e=h?.meta||{},t=$(u.sivuId),n=k[t],s=t>0?k[t-1]:null,a=t<k.length-1?k[t+1]:null,i=[e.course_key||u.kurssiKey,`Oppitunti ${e.lesson_index||u.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=n.kind==="teoria"?`<em>${o(n.title)}</em>`:`${n.num?`${o(n.num)} \xB7 `:""}${o(n.title)}`,c=n.kind==="teoria"?ge():n.kind==="tehtava"?X(n):n.kind==="flashcards"?G(n):V(n);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${N(s,a,"top")}
      <p class="dk__page-meta">${o(i)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${c}
      ${N(s,a,"bottom")}
    </main>`}function N(e,t,n){let s=`dk__prevnext dk__prevnext--${n}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${o(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${o(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,i=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${o(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${o(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${s}">${a}${i}</div>`}function Ke(){return`
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
    </div>`}function He(e){return`
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
            <p>Palaa <a href="#/oppimispolku?lang=${o(u.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function y(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let n=document.getElementById("dk-toggle-sidemenu");n&&n.setAttribute("aria-pressed",e===_?"true":"false")}function Oe(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let n=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=n.dataset.sidemenu===v?_:v;y(a)}else{let a=n.dataset.sidemenu===_?v:_;y(a),ke(a)}}),t?.addEventListener("click",()=>{y(_)})}function x(e){if(!e||e===u.sivuId||k.findIndex(r=>r.id===e)<0)return;u.sivuId=e;let n=`#/oppitunti/${u.lang}/${encodeURIComponent(u.kurssiKey)}/${u.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==n&&history.replaceState(null,"",n);let s=document.getElementById("dk-root");if(!s)return;let a=s.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(r=>{let c=r.dataset.sivu===e;r.classList.toggle("is-active",c),r.setAttribute("aria-current",c?"page":"false")});let i=s.querySelector(".dk__content");if(i){let r=document.createElement("div");r.innerHTML=ee(),i.replaceWith(r.firstElementChild),ne()}window.matchMedia("(max-width: 1023px)").matches&&y(_),te(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function Re(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&x(t.dataset.sivu)})}function te(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let n=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,n)}})}function ne(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>x(e.dataset.sivu))}),Q(),z()}function Pe(){q=!0}async function Ne(e={}){q||Pe(),u.lang=e.lang||u.lang,u.kurssiKey=e.kurssiKey||u.kurssiKey,u.lessonIndex=Number(e.lessonIndex)||u.lessonIndex,u.sivuId=e.sivuId||u.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=Ke(),T("screen-digikirja");let n=`${u.lang}/${u.kurssiKey}/${u.lessonIndex}`;I=n;try{let s=await fe(u);if(I!==n)return;h=s,k=me(s),k.some(r=>r.id===u.sivuId)||(u.sivuId=k[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?_:pe();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${ve()}
        <div class="dk__body">
          ${ye()}
          ${ee()}
        </div>
      </div>`,y(i),Oe(),Re(),ne(),te()}catch(s){if(I!==n)return;t.innerHTML=He(s)}}function Ue(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(Ne({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{Pe as initDigikirja,Ne as showDigikirja,Ue as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-R5HPEUOT.js.map
