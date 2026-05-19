import{b as A}from"./app-chunk-AE7C6F2Z.js";import{b as P}from"./app-chunk-3WC2U67L.js";function me(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function y(e){let t=me(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function R(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function N(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function fe(e,t){let s=N(e),n=t.map(N),a=s.map(d=>`<th>${y(d)}</th>`).join(""),i=n.map(d=>`<tr>${d.map(c=>`<td>${y(c)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function ve(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${y(n)}</p>`).join("")}</div>
    </aside>`}function ye(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${y(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function q(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<t.length;){let i=t[n];if(/^\s*$/.test(i)){n++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(i);if(r){let l=r[1].length,c=r[2].trim();if(l===1&&!a){a=!0,n++;continue}l===2?s.push(`<h3 class="dk__teoria-h2">${y(c)}</h3>`):l===3?s.push(`<h4 class="dk__teoria-h3">${y(c)}</h4>`):s.push(`<h${Math.min(l+1,6)} class="dk__teoria-h">${y(c)}</h${Math.min(l+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let l=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)l.push(t[n]),n++;s.push(ve(l));continue}if(/^\s*\|/.test(i)&&n+1<t.length&&R(t[n+1])){let l=i,c=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)c.push(t[n]),n++;s.push(fe(l,c));continue}if(/^\s*[-*]\s+/.test(i)){let l=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)l.push(t[n]),n++;s.push(ye(l));continue}let d=[i];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&R(t[n+1]));)d.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${y(d.join(" "))}</p>`)}return s.join(`
`)}var G="puheo:dk:sidemenu",x="open",v="collapsed",be={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},F={teoria:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  </svg>`};function ge(e){return F[e]||F.tehtava}var W=5,$e="puheo:dk:flashcards",D={itsearviointi:{label:"Itsearviointi, tulossa PR 7",body:"Lyhyt 1\u20135 asteikollinen lomake: hallitsen aiheen sanaston, tunnistan rakenteet, voin keskustella. Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa."}},z=!1,u={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},h=null,_=[],T="";function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function xe(){try{return localStorage.getItem(G)===v?v:x}catch{return x}}function we(e){try{localStorage.setItem(G,e)}catch{}}function Ie(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function Se(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function Ee(e){let t=Se(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}function Ae(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"});let s=Array.isArray(e?.phases)?e.phases:[];s.forEach((c,p)=>{let k=String(p+1),m=c.title||`Vaihe ${k}`,f=Array.isArray(c.items)?c.items.length:0;t.push({id:`phase-${p}`,kind:"tehtava",num:k,title:m,meta:f?`${f} kohtaa`:"Teht\xE4v\xE4"})});let n=Array.isArray(e?.vocab)?e.vocab:[],a=Math.min(n.length,W);a>0&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${a} korttia`});let i=c=>s.findIndex(p=>Array.isArray(p.items)&&p.items[0]?.item_type===c),r=i("translate"),d=i("mc"),l=6;if(r>=0){let c=Math.min(l,(s[r].items||[]).length);t.push({id:"test-1",kind:"testi",num:"T1",title:"Test 1 \xB7 K\xE4\xE4nn\xE4",meta:`${c} kohtaa`,testDef:{sourcePhase:r,count:c,label:"K\xE4\xE4nn\xE4 espanjaksi"}})}if(d>=0){let c=Math.min(l,(s[d].items||[]).length);t.push({id:"test-2",kind:"testi",num:"T2",title:"Test 2 \xB7 Valitse",meta:`${c} kohtaa`,testDef:{sourcePhase:d,count:c,label:"Valitse oikea vaihtoehto"}})}return t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function $(e){let t=_.findIndex(s=>s.id===e);return t>=0?t:0}function Te(){let e=h?.meta||{},t=e.course_key||u.kurssiKey||"",s=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${o(u.lang)}">${o(Ie(u.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${o(u.lang)}/${encodeURIComponent(u.kurssiKey)}">${o(t)}</a>
      </nav>
      <h1 class="dk__title">${o(s)}</h1>
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
    </header>`}function Ce(){let e=[],t=null;for(let n of _){let a=be[n.kind]||"Muut";a!==t&&(e.push({title:a,items:[]}),t=a),e[e.length-1].items.push(n)}let s=e.map(n=>{let a=`<span class="dk__group-title">${o(n.title)}</span>`,i=n.items.map(r=>{let d=r.id===u.sivuId,l=r.num||"\xB7";return`
        <button type="button"
                class="dk__row${d?" is-active":""}"
                data-sivu="${o(r.id)}"
                data-kind="${o(r.kind)}"
                aria-current="${d?"page":"false"}"
                aria-label="${o(r.title)}">
          <span class="dk__row-glyph-wrap" aria-hidden="true">${ge(r.kind)}</span>
          <span class="dk__row-num">${o(l)}</span>
          <span class="dk__row-title">${o(r.title)}</span>
          <span class="dk__row-meta">${o(r.meta||"")}</span>
        </button>`}).join("");return a+i}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${_.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${s}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function Le(){let e=h?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=q(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${o(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function J(e){let t=D[e.kind]||D.flashcards;return`
    <div class="dk__placeholder" data-kind="${o(e.kind)}">
      <p class="dk__placeholder-kind">${o(t.label)}</p>
      <p>${o(t.body)}</p>
    </div>`}var j=new Map;function Z(e){let t=e?.testDef;return t?((Array.isArray(h?.phases)?h.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(a=>re.has(a.item_type)):[]}function X(e,t){let s=j.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},j.set(e,s)),s}function Q(e){let t=Z(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=X(e.id,t),n=e.testDef?.label||e.title||"Testi",a=t.map((d,l)=>je(d,l,s)).join(""),i=s.submitted?Me(t,s):"",r=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${o(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${o(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${r}</div>
    </section>`}function je(e,t,s){let n=s.submitted,a=s.results[t],i=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",r=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,d="";switch(e.item_type){case"mc":{let c=n?a?.choiceIndex:s.answers[t]===null?-1:s.answers[t],p=e.correct_index;d=`
        <p class="dk__exercise-stem dk__testi-stem">${o(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((k,m)=>{let f=c===m,b=m===p,g=["dk__choice"];return n?f&&b?g.push("is-correct"):f&&!b?g.push("is-wrong"):b&&g.push("is-revealed"):f&&g.push("is-selected"),`
              <li>
                <button type="button" class="${g.join(" ")}"
                        data-testi-item="${t}" data-choice="${m}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+m)}</span>
                  <span class="dk__choice-text">${o(k)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let c=n?a?.userAnswer||"":s.answers[t]||"";d=`
        <p class="dk__exercise-stem dk__testi-stem">${o(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${o(c)}</textarea>`:` value="${o(c)}">`}
        </div>`;break}case"gap_fill":{let c=String(e.sentence_template||""),p=n?a?.userAnswer||[]:s.answers[t]||[],k=0,m=o(c).replace(/\{(\d+)\}/g,()=>{let b=p[k]||"",g=`dk-testi-${t}-gap-${k}`,he=k;return k++,`<input id="${g}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${he}"
                       autocomplete="off" spellcheck="false"
                       value="${o(b)}" ${n?"disabled":""}>`}),f=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(b=>`<li><span>${o(b)}</span></li>`).join("")}
           </ul>`:"";d=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${m}</p>${f}`;break}default:d=`<p>${o(i)}</p>`}let l=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(le(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${r}
      </div>
      <div class="dk__testi-itembody">
        ${d}
        ${l}
      </div>
    </li>`}function Me(e,t){let s=e.length,n=t.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku \u2014 kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${o(i)}</p>
    </div>`}function Be(e,t){return e.map((n,a)=>{switch(n.item_type){case"mc":return t.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(r=>r.value);default:return null}})}function V(){let e=$(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=Q(t),s.replaceWith(n.firstElementChild),ee()}function ee(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=_.find(i=>i.id===t),n=Z(s),a=X(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let r=Number(i.dataset.testiItem),d=Number(i.dataset.choice);a.answers[r]=d,e.querySelector(`.dk__testi-item[data-testi-item="${r}"]`)?.querySelectorAll(".dk__choice").forEach(c=>{c.classList.toggle("is-selected",Number(c.dataset.choice)===d)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=Be(n,a);let i=0;a.results=n.map((r,d)=>{let l=K(r,a.answers[d]);return l.correct&&i++,l}),a.scoreCorrect=i,a.submitted=!0,V(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{j.delete(t),V()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=$(u.sivuId),r=_[i+1];r&&E(r.id)})}var M=new Map,I="know",te="again";function B(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,W)}function H(){return`${$e}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function O(){try{let e=localStorage.getItem(H());return e?JSON.parse(e):{}}catch{return{}}}function Ke(e,t){try{let s=O();s[e]=t,localStorage.setItem(H(),JSON.stringify(s))}catch{}}function He(){try{localStorage.removeItem(H())}catch{}}function se(e){let t=M.get(e);return t||(t={cardIndex:0,flipped:!1},M.set(e,t)),t}function S(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function ne(e){let t=B(h);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=O(),n=t.filter((m,f)=>s[S(m,f)]===I).length;if(n===t.length)return`
      <section class="dk__flashpack" data-sivu="${o(e.id)}" data-done="true">
        <header class="dk__exercise-head">
          <span class="dk__exercise-eyebrow">K\xE4\xE4nt\xF6kortit</span>
          <span class="dk__exercise-score">${n} / ${t.length}</span>
        </header>
        <div class="dk__flashdone">
          <p class="dk__flashdone-headline">Pakka k\xE4yty l\xE4pi.</p>
          <p class="dk__flashdone-sub">Voit palata kortteihin my\xF6hemmin, tai nollata edistymisesi ja harjoitella uudelleen.</p>
          <div class="dk__exercise-actions">
            <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-reset">Aloita alusta</button>
            <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-next-sivu">Seuraava sivu \u2192</button>
          </div>
        </div>
      </section>`;let i=se(e.id),r=Math.min(i.cardIndex,t.length-1),l=ae(t,s,r)[0]??r,c=t[l],p=S(c,l),k=s[p]||null;return`
    <section class="dk__flashpack" data-sivu="${o(e.id)}" data-index="${l}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${l+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${Oe(c,p,i.flipped,k)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function ae(e,t,s){let n=[];for(let a=s;a<e.length;a++){let i=S(e[a],a);t[i]!==I&&n.push(a)}for(let a=0;a<s;a++){let i=S(e[a],a);t[i]!==I&&n.push(a)}return n}function Oe(e,t,s,n){let a=e.gender?`<span class="dk__flashcard-tag">${o(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=n===te?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===I?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${s?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${o(t)}"
         aria-pressed="${s?"true":"false"}"
         aria-label="${o(s?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
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
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${s?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${s?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${s?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function C(){let e=$(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=ne(t),s.replaceWith(n.firstElementChild),ie()}function ie(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{He(),M.delete(t),C()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let l=$(u.sivuId),c=_[l+1];c&&E(c.id)}),e.dataset.done==="true")return;let s=se(t),n=Number(e.dataset.index),a=B(h)[n];if(!a)return;let i=S(a,n),r=()=>{s.flipped=!s.flipped,C()};document.getElementById("dk-flashcard")?.addEventListener("click",r),document.getElementById("dk-flashcard")?.addEventListener("keydown",l=>{(l.key===" "||l.key==="Enter")&&(l.preventDefault(),r())}),document.getElementById("dk-flash-flip")?.addEventListener("click",r);let d=l=>{Ke(i,l),s.flipped=!1;let c=O(),p=B(h),k=ae(p,c,n+1<p.length?n+1:0);s.cardIndex=k[0]??n,C()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>d(te)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>d(I))}var U=new Map,re=new Set(["mc","typed","gap_fill","translate"]);function oe(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(h?.phases)?h.phases:[])[s]||null}function ce(e,t){let s=U.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},U.set(e,s)),s}function de(e){let t=oe(e);if(!t)return J(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(!re.has(n)){let l=n==="match"?"Yhdist\xE4misteht\xE4v\xE4, tulossa PR 4b":n==="writing"?"Kirjoitusteht\xE4v\xE4, tulossa PR 7":`Teht\xE4v\xE4tyyppi "${n}" tulossa my\xF6hemmin`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${o(l)}</p>
        <p>Vaihe ${o(String((Pe(e)??0)+1))}: ${o(t.title||"")}. Vaiheessa ${s.length} teht\xE4v\xE4\xE4 t\xE4t\xE4 tyyppi\xE4.</p>
      </div>`}let a=ce(e.id,s),i=Math.min(a.itemIndex,s.length-1),r=s[i],d=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${o(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>
      </header>
      ${Re(r,d)}
      ${Ve(r,d,i,s.length)}
    </section>`}function Pe(e){let t=/^phase-(\d+)$/.exec(e.id);return t?Number(t[1]):null}function Re(e,t){switch(e.item_type){case"mc":return Ne(e,t);case"typed":return qe(e,t);case"gap_fill":return Fe(e,t);case"translate":return De(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${o(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function Ne(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${o(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((r,d)=>{let l=a&&i===d,c=a&&d===n,p=["dk__choice"];return l&&c?p.push("is-correct"):l&&!c?p.push("is-wrong"):a&&c&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${d}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+d)}</span>
              <span class="dk__choice-text">${o(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function qe(e,t){let s=e.hint||"",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-stem">${o(e.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${o(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${o(n)}"
             ${a?"disabled":""}>
    </div>`}function Fe(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(n).fill(""),i=!!t,r=0,d=o(s).replace(/\{(\d+)\}/g,()=>{let c=a[r]||"",p=`dk-gap-${r}`;return r++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${o(c)}" ${i?"disabled":""}>`}),l=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(c=>`<li><span>${o(c)}</span></li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${d}</p>
    ${l}`}function De(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${o(s)}</p>
    <p class="dk__exercise-stem">${o(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${o(n)}</textarea>
    </div>`}function Ve(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",r=a?"Oikein":"Viel\xE4 ei aivan",d=Ue(e,t),l=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${r}</span>
      ${d}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${l?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function Ue(e,t){let s=le(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(s)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${o(t.accentHint)}</p>`:"";return`${n}${i}${a}`}function le(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}default:return""}}function K(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let a of n){let i=A(s,a,u.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<n.length;i++){let r=Array.isArray(n[i])?n[i]:[n[i]],d=String(s[i]||"").trim(),l=!1;for(let c of r)if(A(d,String(c),u.lang||"es").ok){l=!0;break}if(!l){a=!1;break}}return{correct:a,userAnswer:s}}default:return{correct:!1}}}function Ye(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);default:return null}}function L(){let e=$(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=de(t),s.replaceWith(n.firstElementChild),ue()}function ue(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=_.find(c=>c.id===t),n=oe(s);if(!n)return;let a=n.items||[],i=Number(e.dataset.index),r=a[i];if(!r)return;let d=ce(t,a);e.querySelectorAll(".dk__choice").forEach(c=>{c.addEventListener("click",()=>{if(d.answered[i])return;let p=Number(c.dataset.choice),k=K(r,p);d.answered[i]=k,k.correct&&d.scoreCorrect++,d.scoreTotal++,L()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(d.answered[i])return;let c=Ye(r),p=K(r,c);d.answered[i]=p,p.correct&&d.scoreCorrect++,d.scoreTotal++,L()}),e.querySelector("#dk-input")?.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&!d.answered[i]&&(c.preventDefault(),document.getElementById("dk-check")?.click())}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)d.itemIndex=i+1,L();else{let c=$(u.sivuId),p=_[c+1];p&&E(p.id)}})}function pe(){let e=h?.meta||{},t=$(u.sivuId),s=_[t],n=t>0?_[t-1]:null,a=t<_.length-1?_[t+1]:null,i=[e.course_key||u.kurssiKey,`Oppitunti ${e.lesson_index||u.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=s.kind==="teoria"?`<em>${o(s.title)}</em>`:`${s.num?`${o(s.num)} \xB7 `:""}${o(s.title)}`,d=s.kind==="teoria"?Le():s.kind==="tehtava"?de(s):s.kind==="flashcards"?ne(s):s.kind==="testi"?Q(s):J(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${Y(n,a,"top")}
      <p class="dk__page-meta">${o(i)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${d}
      ${Y(n,a,"bottom")}
    </main>`}function Y(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${o(e.id)}">
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
       </button>`;return`<div class="${n}">${a}${i}</div>`}function Ge(){return`
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
    </div>`}function We(e){return`
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
    </div>`}function w(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===v?"true":"false")}function ze(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===x?v:x;w(a)}else{let a=s.dataset.sidemenu===v?x:v;w(a),we(a)}}),t?.addEventListener("click",()=>{w(v)})}function E(e){if(!e||e===u.sivuId||_.findIndex(r=>r.id===e)<0)return;u.sivuId=e;let s=`#/oppitunti/${u.lang}/${encodeURIComponent(u.kurssiKey)}/${u.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(r=>{let d=r.dataset.sivu===e;r.classList.toggle("is-active",d),r.setAttribute("aria-current",d?"page":"false")});let i=n.querySelector(".dk__content");if(i){let r=document.createElement("div");r.innerHTML=pe(),i.replaceWith(r.firstElementChild),ke()}window.matchMedia("(max-width: 1023px)").matches&&w(v),_e(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function Je(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&E(t.dataset.sivu)})}function _e(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function ke(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>E(e.dataset.sivu))}),ue(),ie(),ee()}function Ze(){z=!0}async function Xe(e={}){z||Ze(),u.lang=e.lang||u.lang,u.kurssiKey=e.kurssiKey||u.kurssiKey,u.lessonIndex=Number(e.lessonIndex)||u.lessonIndex,u.sivuId=e.sivuId||u.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=Ge(),P("screen-digikirja");let s=`${u.lang}/${u.kurssiKey}/${u.lessonIndex}`;T=s;try{let n=await Ee(u);if(T!==s)return;h=n,_=Ae(n),_.some(r=>r.id===u.sivuId)||(u.sivuId=_[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?v:xe();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${Te()}
        <div class="dk__body">
          ${Ce()}
          ${pe()}
        </div>
      </div>`,w(i),ze(),Je(),ke(),_e()}catch(n){if(T!==s)return;t.innerHTML=We(n)}}function nt(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(Xe({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{Ze as initDigikirja,Xe as showDigikirja,nt as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-DI6TJDT3.js.map
