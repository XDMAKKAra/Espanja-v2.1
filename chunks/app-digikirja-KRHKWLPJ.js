import{b as O}from"./app-chunk-AE7C6F2Z.js";import{a as S,c as K,e as E,j as A}from"./app-chunk-NZWTLFMY.js";import{b as W}from"./app-chunk-3WC2U67L.js";function Oe(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function g(e){let t=Oe(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function z(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function X(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function Be(e,t){let s=X(e),n=t.map(X),a=s.map(o=>`<th>${g(o)}</th>`).join(""),i=n.map(o=>`<tr>${o.map(c=>`<td>${g(c)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function Pe(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${g(n)}</p>`).join("")}</div>
    </aside>`}function Re(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${g(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function Z(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<t.length;){let i=t[n];if(/^\s*$/.test(i)){n++;continue}let d=/^(#{1,6})\s+(.*)$/.exec(i);if(d){let l=d[1].length,c=d[2].trim();if(l===1&&!a){a=!0,n++;continue}l===2?s.push(`<h3 class="dk__teoria-h2">${g(c)}</h3>`):l===3?s.push(`<h4 class="dk__teoria-h3">${g(c)}</h4>`):s.push(`<h${Math.min(l+1,6)} class="dk__teoria-h">${g(c)}</h${Math.min(l+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let l=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)l.push(t[n]),n++;s.push(Pe(l));continue}if(/^\s*\|/.test(i)&&n+1<t.length&&z(t[n+1])){let l=i,c=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)c.push(t[n]),n++;s.push(Be(l,c));continue}if(/^\s*[-*]\s+/.test(i)){let l=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)l.push(t[n]),n++;s.push(Re(l));continue}let o=[i];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&z(t[n+1]));)o.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${g(o.join(" "))}</p>`)}return s.join(`
`)}var ie="puheo:dk:sidemenu",T="open",y="collapsed",Ne="puheo:dk:progress";function re(){return`${Ne}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function M(){try{return JSON.parse(localStorage.getItem(re())||"{}")}catch{return{}}}function oe(e){try{localStorage.setItem(re(),JSON.stringify(e))}catch{}}function x(e){if(!e)return;let t=M();t[e]!=="done"&&(t[e]="done",oe(t),K()&&A(`${S}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...E()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,sivuId:e})}).catch(()=>{}),V())}function V(){let e=M(),t=document.getElementById("dk-sidemenu-list");t&&t.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",e[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=k.filter(a=>e[a.id]==="done").length;s.textContent=`${n} / ${k.length} valmis`,s.dataset.full=n>=k.length?"true":"false"}}var He={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"},Q={teoria:`<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  </svg>`};function qe(e){return Q[e]||Q.tehtava}var ce=5,De="puheo:dk:flashcards",ee={},de=!1,u={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},f=null,k=[],B="";function r(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function Fe(){try{return localStorage.getItem(ie)===y?y:T}catch{return T}}function Ve(e){try{localStorage.setItem(ie,e)}catch{}}function Ue(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function Je(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function Ye(e){let t=Je(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function Ge(e){if(K())try{let t=`lang=${encodeURIComponent(e.lang)}&kurssi=${encodeURIComponent(e.kurssiKey)}&lesson=${encodeURIComponent(e.lessonIndex)}`,[s,n]=await Promise.all([A(`${S}/api/digikirja/progress?${t}`,{headers:E()}).catch(()=>null),A(`${S}/api/digikirja/itsearvio?${t}`,{headers:E()}).catch(()=>null)]);if(s?.ok){let{sivut:a}=await s.json().catch(()=>({sivut:{}}));if(a&&typeof a=="object"){let i=M();for(let d of Object.keys(a))i[d]||(i[d]="done");oe(i)}}if(n?.ok){let{itsearvio:a}=await n.json().catch(()=>({itsearvio:null}));a?.ratings&&(J()||me({ratings:a.ratings,submittedAt:a.submittedAt,lang:e.lang,kurssiKey:e.kurssiKey,lessonIndex:e.lessonIndex}))}}catch{}}function We(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"});let s=Array.isArray(e?.phases)?e.phases:[];s.forEach((c,p)=>{let _=String(p+1),h=c.title||`Vaihe ${_}`,m=Array.isArray(c.items)?c.items.length:0;t.push({id:`phase-${p}`,kind:"tehtava",num:_,title:h,meta:m?`${m} kohtaa`:"Teht\xE4v\xE4"})});let n=Array.isArray(e?.vocab)?e.vocab:[],a=Math.min(n.length,ce);a>0&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${a} korttia`});let i=c=>s.findIndex(p=>Array.isArray(p.items)&&p.items[0]?.item_type===c),d=i("translate"),o=i("mc"),l=6;if(d>=0){let c=Math.min(l,(s[d].items||[]).length);t.push({id:"test-1",kind:"testi",num:"T1",title:"Test 1 \xB7 K\xE4\xE4nn\xE4",meta:`${c} kohtaa`,testDef:{sourcePhase:d,count:c,label:"K\xE4\xE4nn\xE4 espanjaksi"}})}if(o>=0){let c=Math.min(l,(s[o].items||[]).length);t.push({id:"test-2",kind:"testi",num:"T2",title:"Test 2 \xB7 Valitse",meta:`${c} kohtaa`,testDef:{sourcePhase:o,count:c,label:"Valitse oikea vaihtoehto"}})}return t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function b(e){let t=k.findIndex(s=>s.id===e);return t>=0?t:0}function ze(){let e=f?.meta||{},t=e.course_key||u.kurssiKey||"",s=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${r(u.lang)}">${r(Ue(u.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${r(u.lang)}/${encodeURIComponent(u.kurssiKey)}">${r(t)}</a>
      </nav>
      <h1 class="dk__title">${r(s)}</h1>
      <div class="dk__tools">
        <span class="dk__progress-chip" id="dk-progress-chip" aria-live="polite">0 / 0 valmis</span>
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
    </header>`}function Xe(){let e=[],t=null;for(let a of k){let i=He[a.kind]||"Muut";i!==t&&(e.push({title:i,items:[]}),t=i),e[e.length-1].items.push(a)}let s=M(),n=e.map(a=>{let i=`<span class="dk__group-title">${r(a.title)}</span>`,d=a.items.map(o=>{let l=o.id===u.sivuId,c=s[o.id]==="done",p=o.num||"\xB7",_=["dk__row"];return l&&_.push("is-active"),c&&_.push("is-done"),`
        <button type="button"
                class="${_.join(" ")}"
                data-sivu="${r(o.id)}"
                data-kind="${r(o.kind)}"
                aria-current="${l?"page":"false"}"
                aria-label="${r(o.title)}${c?", suoritettu":""}">
          <span class="dk__row-glyph-wrap" aria-hidden="true">${qe(o.kind)}</span>
          <span class="dk__row-num">${r(p)}</span>
          <span class="dk__row-title">${r(o.title)}</span>
          <span class="dk__row-meta">${r(o.meta||"")}</span>
        </button>`}).join("");return i+d}).join("");return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${k.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function le(){u.sivuId==="teoria"&&x("teoria")}function Ze(){let e=f?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=Z(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${r(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function ue(e){let t=ee[e.kind]||ee.flashcards;return`
    <div class="dk__placeholder" data-kind="${r(e.kind)}">
      <p class="dk__placeholder-kind">${r(t.label)}</p>
      <p>${r(t.body)}</p>
    </div>`}var N=new Map;function pe(e){let t=e?.testDef;return t?((Array.isArray(f?.phases)?f.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(a=>Ie.has(a.item_type)):[]}function _e(e,t){let s=N.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},N.set(e,s)),s}function ke(e){let t=pe(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=_e(e.id,t),n=e.testDef?.label||e.title||"Testi",a=t.map((o,l)=>Qe(o,l,s)).join(""),i=s.submitted?et(t,s):"",d=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${r(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${r(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${d}</div>
    </section>`}function Qe(e,t,s){let n=s.submitted,a=s.results[t],i=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",d=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,o="";switch(e.item_type){case"mc":{let c=n?a?.choiceIndex:s.answers[t]===null?-1:s.answers[t],p=e.correct_index;o=`
        <p class="dk__exercise-stem dk__testi-stem">${r(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((_,h)=>{let m=c===h,v=h===p,$=["dk__choice"];return n?m&&v?$.push("is-correct"):m&&!v?$.push("is-wrong"):v&&$.push("is-revealed"):m&&$.push("is-selected"),`
              <li>
                <button type="button" class="${$.join(" ")}"
                        data-testi-item="${t}" data-choice="${h}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+h)}</span>
                  <span class="dk__choice-text">${r(_)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let c=n?a?.userAnswer||"":s.answers[t]||"";o=`
        <p class="dk__exercise-stem dk__testi-stem">${r(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${r(c)}</textarea>`:` value="${r(c)}">`}
        </div>`;break}case"gap_fill":{let c=String(e.sentence_template||""),p=n?a?.userAnswer||[]:s.answers[t]||[],_=0,h=r(c).replace(/\{(\d+)\}/g,()=>{let v=p[_]||"",$=`dk-testi-${t}-gap-${_}`,Me=_;return _++,`<input id="${$}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${Me}"
                       autocomplete="off" spellcheck="false"
                       value="${r(v)}" ${n?"disabled":""}>`}),m=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(v=>`<li><span>${r(v)}</span></li>`).join("")}
           </ul>`:"";o=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${h}</p>${m}`;break}default:o=`<p>${r(i)}</p>`}let l=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${r(Te(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${r(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${d}
      </div>
      <div class="dk__testi-itembody">
        ${o}
        ${l}
      </div>
    </li>`}function et(e,t){let s=e.length,n=t.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku \u2014 kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${r(i)}</p>
    </div>`}function tt(e,t){return e.map((n,a)=>{switch(n.item_type){case"mc":return t.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(d=>d.value);default:return null}})}function te(){let e=b(u.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=ke(t),s.replaceWith(n.firstElementChild),he()}function he(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=k.find(i=>i.id===t),n=pe(s),a=_e(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let d=Number(i.dataset.testiItem),o=Number(i.dataset.choice);a.answers[d]=o,e.querySelector(`.dk__testi-item[data-testi-item="${d}"]`)?.querySelectorAll(".dk__choice").forEach(c=>{c.classList.toggle("is-selected",Number(c.dataset.choice)===o)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=tt(n,a);let i=0;a.results=n.map((d,o)=>{let l=F(d,a.answers[o]);return l.correct&&i++,l}),a.scoreCorrect=i,a.submitted=!0,x(t),te(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{N.delete(t),te()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=b(u.sivuId),d=k[i+1];d&&L(d.id)})}var st="puheo:dk:itsearvio",j=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],nt=["heikko","vajaa","kohtuu","vahva","hallitsen"];function U(){return`${st}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function J(){try{return JSON.parse(localStorage.getItem(U())||"null")}catch{return null}}function me(e){try{localStorage.setItem(U(),JSON.stringify(e))}catch{}}var H=new Map;function fe(e){let t=H.get(e);return t||(t={...J()?.ratings||{}},H.set(e,t)),t}function ve(e){let t=fe(e.id),s=J(),n=!!s,a=j.map(l=>{let c=n?s.ratings?.[l.id]??0:t[l.id]??0,p=[1,2,3,4,5].map(_=>`
      <button type="button"
              class="dk__arvio-btn ${c===_?"is-chosen":""}"
              data-statement="${r(l.id)}"
              data-value="${_}"
              aria-pressed="${c===_}"
              aria-label="${_}, ${r(nt[_-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${_}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${r(l.id)}">
        <p class="dk__arvio-statement">${r(l.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${r(l.text)}">
          ${p}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),i=j.every(l=>Number.isInteger(t[l.id])&&t[l.id]>0),d=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${i?"":"disabled"}>Tallenna arvio</button>`,o=n?at(s):"";return`
    <section class="dk__arvio" data-sivu="${r(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${j.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen \u2014 vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${o}
      <div class="dk__arvio-list">${a}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${d}</div>
    </section>`}function at(e){let t=e?.ratings||{},s=j.map(i=>t[i.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((i,d)=>i+d,0)/s.length,a=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${r(a)}</p>
    </div>`}function se(){let e=b(u.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=ve(t),s.replaceWith(n.firstElementChild),ye()}function ye(){let e=document.querySelector(".dk__arvio");if(!e)return;let t=e.dataset.sivu,s=fe(t);e.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.statement,i=Number(n.dataset.value);s[a]=i,e.querySelector(`.dk__arvio-row[data-statement="${a}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(l=>{let c=Number(l.dataset.value)===i;l.classList.toggle("is-chosen",c),l.setAttribute("aria-pressed",c?"true":"false")});let o=document.getElementById("dk-arvio-submit");if(o){let l=j.every(c=>Number.isInteger(s[c.id])&&s[c.id]>0);o.disabled=!l}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:u.lang,kurssiKey:u.kurssiKey,lessonIndex:u.lessonIndex};me(n),x(t),se(),K()&&A(`${S}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...E()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(U())}catch{}H.delete(t),se()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${u.lang}/${encodeURIComponent(u.kurssiKey)}`})}var q=new Map,w="know",ge="again";function D(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,ce)}function Y(){return`${De}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function G(){try{let e=localStorage.getItem(Y());return e?JSON.parse(e):{}}catch{return{}}}function it(e,t){try{let s=G();s[e]=t,localStorage.setItem(Y(),JSON.stringify(s))}catch{}}function rt(){try{localStorage.removeItem(Y())}catch{}}function be(e){let t=q.get(e);return t||(t={cardIndex:0,flipped:!1},q.set(e,t)),t}function I(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function $e(e){let t=D(f);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=G(),n=t.filter((h,m)=>s[I(h,m)]===w).length;if(n===t.length)return`
      <section class="dk__flashpack" data-sivu="${r(e.id)}" data-done="true">
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
      </section>`;let i=be(e.id),d=Math.min(i.cardIndex,t.length-1),l=xe(t,s,d)[0]??d,c=t[l],p=I(c,l),_=s[p]||null;return`
    <section class="dk__flashpack" data-sivu="${r(e.id)}" data-index="${l}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${l+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${ot(c,p,i.flipped,_)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function xe(e,t,s){let n=[];for(let a=s;a<e.length;a++){let i=I(e[a],a);t[i]!==w&&n.push(a)}for(let a=0;a<s;a++){let i=I(e[a],a);t[i]!==w&&n.push(a)}return n}function ot(e,t,s,n){let a=e.gender?`<span class="dk__flashcard-tag">${r(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=n===ge?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===w?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${s?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${r(t)}"
         aria-pressed="${s?"true":"false"}"
         aria-label="${r(s?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${a}${i}
          </div>
          <p class="dk__flashcard-word">${r(e.es||"")}</p>
          <p class="dk__flashcard-hint-pad">Yrit\xE4 muistaa, sitten k\xE4\xE4nn\xE4.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${i}
          </div>
          <p class="dk__flashcard-word">${r(e.fi||"")}</p>
          ${e.example_es?`<p class="dk__flashcard-example"><span lang="es">${r(e.example_es)}</span></p>`:""}
          ${e.example_fi?`<p class="dk__flashcard-example dk__flashcard-example--fi">${r(e.example_fi)}</p>`:""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${s?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${s?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${s?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function P(){let e=b(u.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=$e(t),s.replaceWith(n.firstElementChild),we()}function we(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{rt(),q.delete(t),P()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let l=b(u.sivuId),c=k[l+1];c&&L(c.id)}),e.dataset.done==="true")return;let s=be(t),n=Number(e.dataset.index),a=D(f)[n];if(!a)return;let i=I(a,n),d=()=>{s.flipped=!s.flipped,P()};document.getElementById("dk-flashcard")?.addEventListener("click",d),document.getElementById("dk-flashcard")?.addEventListener("keydown",l=>{(l.key===" "||l.key==="Enter")&&(l.preventDefault(),d())}),document.getElementById("dk-flash-flip")?.addEventListener("click",d);let o=l=>{it(i,l),s.flipped=!1;let c=G(),p=D(f);p.length>0&&p.every((m,v)=>c[I(m,v)]===w)&&x(t);let h=xe(p,c,n+1<p.length?n+1:0);s.cardIndex=h[0]??n,P()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>o(ge)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>o(w))}var ne=new Map,Ie=new Set(["mc","typed","gap_fill","translate"]);function Se(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(f?.phases)?f.phases:[])[s]||null}function Ee(e,t){let s=ne.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},ne.set(e,s)),s}function Ae(e){let t=Se(e);if(!t)return ue(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(!Ie.has(n)){let l=n==="match"?"Yhdist\xE4misteht\xE4v\xE4, tulossa PR 4b":n==="writing"?"Kirjoitusteht\xE4v\xE4, tulossa PR 7":`Teht\xE4v\xE4tyyppi "${n}" tulossa my\xF6hemmin`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${r(l)}</p>
        <p>Vaihe ${r(String((ct(e)??0)+1))}: ${r(t.title||"")}. Vaiheessa ${s.length} teht\xE4v\xE4\xE4 t\xE4t\xE4 tyyppi\xE4.</p>
      </div>`}let a=Ee(e.id,s),i=Math.min(a.itemIndex,s.length-1),d=s[i],o=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${r(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>
      </header>
      ${dt(d,o)}
      ${kt(d,o,i,s.length)}
    </section>`}function ct(e){let t=/^phase-(\d+)$/.exec(e.id);return t?Number(t[1]):null}function dt(e,t){switch(e.item_type){case"mc":return lt(e,t);case"typed":return ut(e,t);case"gap_fill":return pt(e,t);case"translate":return _t(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${r(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function lt(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${r(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((d,o)=>{let l=a&&i===o,c=a&&o===n,p=["dk__choice"];return l&&c?p.push("is-correct"):l&&!c?p.push("is-wrong"):a&&c&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${o}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+o)}</span>
              <span class="dk__choice-text">${r(d)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function ut(e,t){let s=e.hint||"",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-stem">${r(e.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${r(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${r(n)}"
             ${a?"disabled":""}>
    </div>`}function pt(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(n).fill(""),i=!!t,d=0,o=r(s).replace(/\{(\d+)\}/g,()=>{let c=a[d]||"",p=`dk-gap-${d}`;return d++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${d-1}" autocomplete="off" spellcheck="false"
                   value="${r(c)}" ${i?"disabled":""}>`}),l=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(c=>`<li><span>${r(c)}</span></li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${o}</p>
    ${l}`}function _t(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${r(s)}</p>
    <p class="dk__exercise-stem">${r(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${r(n)}</textarea>
    </div>`}function kt(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",d=a?"Oikein":"Viel\xE4 ei aivan",o=ht(e,t),l=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${d}</span>
      ${o}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${l?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function ht(e,t){let s=Te(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${r(s)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${r(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${r(t.accentHint)}</p>`:"";return`${n}${i}${a}`}function Te(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}default:return""}}function F(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let a of n){let i=O(s,a,u.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<n.length;i++){let d=Array.isArray(n[i])?n[i]:[n[i]],o=String(s[i]||"").trim(),l=!1;for(let c of d)if(O(o,String(c),u.lang||"es").ok){l=!0;break}if(!l){a=!1;break}}return{correct:a,userAnswer:s}}default:return{correct:!1}}}function mt(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);default:return null}}function R(){let e=b(u.sivuId),t=k[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=Ae(t),s.replaceWith(n.firstElementChild),je()}function je(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=k.find(c=>c.id===t),n=Se(s);if(!n)return;let a=n.items||[],i=Number(e.dataset.index),d=a[i];if(!d)return;let o=Ee(t,a);e.querySelectorAll(".dk__choice").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[i])return;let p=Number(c.dataset.choice),_=F(d,p);o.answered[i]=_,_.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&x(t),R()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(o.answered[i])return;let c=mt(d),p=F(d,c);o.answered[i]=p,p.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&x(t),R()}),e.querySelector("#dk-input")?.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&!o.answered[i]&&(c.preventDefault(),document.getElementById("dk-check")?.click())}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)o.itemIndex=i+1,R();else{let c=b(u.sivuId),p=k[c+1];p&&L(p.id)}})}function Ce(){let e=f?.meta||{},t=b(u.sivuId),s=k[t],n=t>0?k[t-1]:null,a=t<k.length-1?k[t+1]:null,i=[e.course_key||u.kurssiKey,`Oppitunti ${e.lesson_index||u.lessonIndex}`].filter(Boolean).join(" \xB7 "),d=s.kind==="teoria"?`<em>${r(s.title)}</em>`:`${s.num?`${r(s.num)} \xB7 `:""}${r(s.title)}`,o=s.kind==="teoria"?Ze():s.kind==="tehtava"?Ae(s):s.kind==="flashcards"?$e(s):s.kind==="testi"?ke(s):s.kind==="itsearviointi"?ve(s):ue(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${ae(n,a,"top")}
      <p class="dk__page-meta">${r(i)}</p>
      <h2 class="dk__page-title">${d}</h2>
      ${o}
      ${ae(n,a,"bottom")}
    </main>`}function ae(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${r(e.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${r(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,i=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${r(t.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${r(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${n}">${a}${i}</div>`}function ft(){return`
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
    </div>`}function vt(e){return`
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
            <p>${r(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${r(u.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function C(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===y?"true":"false")}function yt(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===T?y:T;C(a)}else{let a=s.dataset.sidemenu===y?T:y;C(a),Ve(a)}}),t?.addEventListener("click",()=>{C(y)})}function L(e){if(!e||e===u.sivuId||k.findIndex(d=>d.id===e)<0)return;u.sivuId=e;let s=`#/oppitunti/${u.lang}/${encodeURIComponent(u.kurssiKey)}/${u.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(d=>{let o=d.dataset.sivu===e;d.classList.toggle("is-active",o),d.setAttribute("aria-current",o?"page":"false")});let i=n.querySelector(".dk__content");if(i){let d=document.createElement("div");d.innerHTML=Ce(),i.replaceWith(d.firstElementChild),Ke()}window.matchMedia("(max-width: 1023px)").matches&&C(y),Le(),le(),V(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function gt(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&L(t.dataset.sivu)})}function Le(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function Ke(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>L(e.dataset.sivu))}),je(),we(),he(),ye()}function bt(){de=!0}async function $t(e={}){de||bt(),u.lang=e.lang||u.lang,u.kurssiKey=e.kurssiKey||u.kurssiKey,u.lessonIndex=Number(e.lessonIndex)||u.lessonIndex,u.sivuId=e.sivuId||u.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=ft(),W("screen-digikirja");let s=`${u.lang}/${u.kurssiKey}/${u.lessonIndex}`;B=s;try{let[n]=await Promise.all([Ye(u),Ge(u)]);if(B!==s)return;f=n,k=We(n),k.some(d=>d.id===u.sivuId)||(u.sivuId=k[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?y:Fe();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${ze()}
        <div class="dk__body">
          ${Xe()}
          ${Ce()}
        </div>
      </div>`,C(i),yt(),gt(),Ke(),Le(),le(),V()}catch(n){if(B!==s)return;t.innerHTML=vt(n)}}function At(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?($t({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{bt as initDigikirja,$t as showDigikirja,At as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-KRHKWLPJ.js.map
