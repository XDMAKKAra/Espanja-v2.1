import{b as O}from"./app-chunk-AE7C6F2Z.js";import{a as S,c as M,d as B,e as E,j as A}from"./app-chunk-NZWTLFMY.js";import{b as z}from"./app-chunk-3WC2U67L.js";function Ke(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function y(e){let t=Ke(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function X(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function Z(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function Be(e,t){let s=Z(e),n=t.map(Z),a=s.map(d=>`<th>${y(d)}</th>`).join(""),i=n.map(d=>`<tr>${d.map(r=>`<td>${y(r)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function Oe(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${y(n)}</p>`).join("")}</div>
    </aside>`}function Pe(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${y(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function Q(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<t.length;){let i=t[n];if(/^\s*$/.test(i)){n++;continue}let c=/^(#{1,6})\s+(.*)$/.exec(i);if(c){let l=c[1].length,r=c[2].trim();if(l===1&&!a){a=!0,n++;continue}l===2?s.push(`<h3 class="dk__teoria-h2">${y(r)}</h3>`):l===3?s.push(`<h4 class="dk__teoria-h3">${y(r)}</h4>`):s.push(`<h${Math.min(l+1,6)} class="dk__teoria-h">${y(r)}</h${Math.min(l+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let l=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)l.push(t[n]),n++;s.push(Oe(l));continue}if(/^\s*\|/.test(i)&&n+1<t.length&&X(t[n+1])){let l=i,r=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)r.push(t[n]),n++;s.push(Be(l,r));continue}if(/^\s*[-*]\s+/.test(i)){let l=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)l.push(t[n]),n++;s.push(Pe(l));continue}let d=[i];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&X(t[n+1]));)d.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${y(d.join(" "))}</p>`)}return s.join(`
`)}var ae="puheo:dk:sidemenu",j="open",g="collapsed",He="puheo:dk:progress";function ie(){return`${He}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function K(){try{return JSON.parse(localStorage.getItem(ie())||"{}")}catch{return{}}}function re(e){try{localStorage.setItem(ie(),JSON.stringify(e))}catch{}}function x(e){if(!e)return;let t=K();t[e]!=="done"&&(t[e]="done",re(t),M()&&A(`${S}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...E()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,sivuId:e})}).catch(()=>{}),U())}function U(){let e=K(),t=document.getElementById("dk-sidemenu-list");t&&t.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",e[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=_.filter(a=>e[a.id]==="done").length;s.textContent=`${n} / ${_.length} valmis`,s.dataset.full=n>=_.length?"true":"false"}}var Ne={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"};var oe=5,Re="puheo:dk:flashcards",ee={},ce=!1,u={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},f=null,_=[],P="";function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function qe(){try{return localStorage.getItem(ae)===g?g:j}catch{return j}}function Ve(e){try{localStorage.setItem(ae,e)}catch{}}function De(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function Fe(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function Ue(e){let t=Fe(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function Je(e){if(M())try{let t=`lang=${encodeURIComponent(e.lang)}&kurssi=${encodeURIComponent(e.kurssiKey)}&lesson=${encodeURIComponent(e.lessonIndex)}`,[s,n]=await Promise.all([A(`${S}/api/digikirja/progress?${t}`,{headers:E()}).catch(()=>null),A(`${S}/api/digikirja/itsearvio?${t}`,{headers:E()}).catch(()=>null)]);if(s?.ok){let{sivut:a}=await s.json().catch(()=>({sivut:{}}));if(a&&typeof a=="object"){let i=K();for(let c of Object.keys(a))i[c]||(i[c]="done");re(i)}}if(n?.ok){let{itsearvio:a}=await n.json().catch(()=>({itsearvio:null}));a?.ratings&&(Y()||he({ratings:a.ratings,submittedAt:a.submittedAt,lang:e.lang,kurssiKey:e.kurssiKey,lessonIndex:e.lessonIndex}))}}catch{}}function Ye(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"});let s=Array.isArray(e?.phases)?e.phases:[];s.forEach((r,p)=>{let k=String(p+1),h=r.title||`Vaihe ${k}`,m=Array.isArray(r.items)?r.items.length:0;t.push({id:`phase-${p}`,kind:"tehtava",num:k,title:h,meta:m?`${m} kohtaa`:"Teht\xE4v\xE4"})});let n=Array.isArray(e?.vocab)?e.vocab:[],a=Math.min(n.length,oe);a>0&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${a} korttia`});let i=r=>s.findIndex(p=>Array.isArray(p.items)&&p.items[0]?.item_type===r),c=i("translate"),d=i("mc"),l=6;if(c>=0){let r=Math.min(l,(s[c].items||[]).length);t.push({id:"test-1",kind:"testi",num:"T1",title:"Test 1 \xB7 K\xE4\xE4nn\xE4",meta:`${r} kohtaa`,testDef:{sourcePhase:c,count:r,label:"K\xE4\xE4nn\xE4 espanjaksi"}})}if(d>=0){let r=Math.min(l,(s[d].items||[]).length);t.push({id:"test-2",kind:"testi",num:"T2",title:"Test 2 \xB7 Valitse",meta:`${r} kohtaa`,testDef:{sourcePhase:d,count:r,label:"Valitse oikea vaihtoehto"}})}return t.push({id:"arvio",kind:"itsearviointi",num:"",title:"Arvioi omia taitojasi",meta:"Itsearvio"}),t}function b(e){let t=_.findIndex(s=>s.id===e);return t>=0?t:0}function Ge(){let e=f?.meta||{},t=e.course_key||u.kurssiKey||"",s=e.title||"Oppitunti";return`
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
        <a href="#/oppimispolku?lang=${o(u.lang)}">${o(De(u.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${o(u.lang)}/${encodeURIComponent(u.kurssiKey)}">${o(t)}</a>
      </nav>
      <h1 class="dk__title">${o(s)}</h1>
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
    </header>`}function We(){let e=[],t=null;for(let c of _){let d=Ne[c.kind]||"Muut";d!==t&&(e.push({title:d,items:[]}),t=d),e[e.length-1].items.push(c)}let s=K(),n=e.map(c=>{let d=`<span class="dk__group-title">${o(c.title)}</span>`,l=c.items.map(r=>{let p=r.id===u.sivuId,k=s[r.id]==="done",h=["dk__row"];p&&h.push("is-active"),k&&h.push("is-done");let m=r.num?`${o(r.num)} `:"";return`
        <button type="button"
                class="${h.join(" ")}"
                data-sivu="${o(r.id)}"
                data-kind="${o(r.kind)}"
                aria-current="${p?"page":"false"}"
                aria-label="${o(r.title)}${k?", suoritettu":""}">
          <span class="dk__row-bullet" aria-hidden="true"></span>
          <span class="dk__row-title">${m}${o(r.title)}</span>
          ${k?'<span class="dk__row-check" aria-hidden="true">\u2713</span>':""}
        </button>`}).join("");return d+l}).join(""),i=typeof B=="function"&&B()||""||"Oma sivu";return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-top">
        <a class="dk__sidemenu-logo" href="#home" data-dk-nav="home" aria-label="Puheo etusivulle">Puhe<span>o</span></a>
        <button type="button" class="dk__sidemenu-action" data-dk-nav="home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9"/></svg>
          <span>Aloitus</span>
        </button>
      </div>
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${_.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
      <div class="dk__sidemenu-footer">
        <button type="button" class="dk__sidemenu-user" data-dk-nav="profile" title="${o(i)}">
          <span class="dk__sidemenu-user-text">${o(i)}</span>
        </button>
        <button type="button" class="dk__sidemenu-action" data-dk-nav="settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
          <span>Asetukset</span>
        </button>
        <button type="button" class="dk__sidemenu-action" data-dk-nav="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          <span>Kirjaudu ulos</span>
        </button>
      </div>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function ze(){let e=document.getElementById("dk-sidemenu");e&&e.addEventListener("click",t=>{let s=t.target.closest("[data-dk-nav]");if(!s)return;let n=s.dataset.dkNav;s.tagName==="A"&&t.preventDefault(),n==="home"?document.querySelector('.sidebar-item[data-nav="home"]')?.click()??(location.hash="#home"):n==="settings"?document.querySelector('.sidebar-item[data-nav="settings"]')?.click():n==="profile"?document.querySelector('.sidebar-user[data-nav="profile"], .sidebar-item[data-nav="profile"]')?.click():n==="logout"&&document.getElementById("sidebar-logout")?.click()})}function de(){u.sivuId==="teoria"&&x("teoria")}function Xe(){let e=f?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=Q(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${o(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function le(e){let t=ee[e.kind]||ee.flashcards;return`
    <div class="dk__placeholder" data-kind="${o(e.kind)}">
      <p class="dk__placeholder-kind">${o(t.label)}</p>
      <p>${o(t.body)}</p>
    </div>`}var R=new Map;function ue(e){let t=e?.testDef;return t?((Array.isArray(f?.phases)?f.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(a=>we.has(a.item_type)):[]}function pe(e,t){let s=R.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},R.set(e,s)),s}function ke(e){let t=ue(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=pe(e.id,t),n=e.testDef?.label||e.title||"Testi",a=t.map((d,l)=>Ze(d,l,s)).join(""),i=s.submitted?Qe(t,s):"",c=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${o(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${o(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${c}</div>
    </section>`}function Ze(e,t,s){let n=s.submitted,a=s.results[t],i=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",c=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,d="";switch(e.item_type){case"mc":{let r=n?a?.choiceIndex:s.answers[t]===null?-1:s.answers[t],p=e.correct_index;d=`
        <p class="dk__exercise-stem dk__testi-stem">${o(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((k,h)=>{let m=r===h,v=h===p,$=["dk__choice"];return n?m&&v?$.push("is-correct"):m&&!v?$.push("is-wrong"):v&&$.push("is-revealed"):m&&$.push("is-selected"),`
              <li>
                <button type="button" class="${$.join(" ")}"
                        data-testi-item="${t}" data-choice="${h}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+h)}</span>
                  <span class="dk__choice-text">${o(k)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let r=n?a?.userAnswer||"":s.answers[t]||"";d=`
        <p class="dk__exercise-stem dk__testi-stem">${o(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${o(r)}</textarea>`:` value="${o(r)}">`}
        </div>`;break}case"gap_fill":{let r=String(e.sentence_template||""),p=n?a?.userAnswer||[]:s.answers[t]||[],k=0,h=o(r).replace(/\{(\d+)\}/g,()=>{let v=p[k]||"",$=`dk-testi-${t}-gap-${k}`,Me=k;return k++,`<input id="${$}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${Me}"
                       autocomplete="off" spellcheck="false"
                       value="${o(v)}" ${n?"disabled":""}>`}),m=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(v=>`<li><span>${o(v)}</span></li>`).join("")}
           </ul>`:"";d=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${h}</p>${m}`;break}default:d=`<p>${o(i)}</p>`}let l=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(Ae(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${c}
      </div>
      <div class="dk__testi-itembody">
        ${d}
        ${l}
      </div>
    </li>`}function Qe(e,t){let s=e.length,n=t.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku \u2014 kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${o(i)}</p>
    </div>`}function et(e,t){return e.map((n,a)=>{switch(n.item_type){case"mc":return t.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(c=>c.value);default:return null}})}function te(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=ke(t),s.replaceWith(n.firstElementChild),_e()}function _e(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=_.find(i=>i.id===t),n=ue(s),a=pe(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let c=Number(i.dataset.testiItem),d=Number(i.dataset.choice);a.answers[c]=d,e.querySelector(`.dk__testi-item[data-testi-item="${c}"]`)?.querySelectorAll(".dk__choice").forEach(r=>{r.classList.toggle("is-selected",Number(r.dataset.choice)===d)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=et(n,a);let i=0;a.results=n.map((c,d)=>{let l=F(c,a.answers[d]);return l.correct&&i++,l}),a.scoreCorrect=i,a.submitted=!0,x(t),te(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{R.delete(t),te()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=b(u.sivuId),c=_[i+1];c&&L(c.id)})}var tt="puheo:dk:itsearvio",T=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],st=["heikko","vajaa","kohtuu","vahva","hallitsen"];function J(){return`${tt}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function Y(){try{return JSON.parse(localStorage.getItem(J())||"null")}catch{return null}}function he(e){try{localStorage.setItem(J(),JSON.stringify(e))}catch{}}var q=new Map;function me(e){let t=q.get(e);return t||(t={...Y()?.ratings||{}},q.set(e,t)),t}function fe(e){let t=me(e.id),s=Y(),n=!!s,a=T.map(l=>{let r=n?s.ratings?.[l.id]??0:t[l.id]??0,p=[1,2,3,4,5].map(k=>`
      <button type="button"
              class="dk__arvio-btn ${r===k?"is-chosen":""}"
              data-statement="${o(l.id)}"
              data-value="${k}"
              aria-pressed="${r===k}"
              aria-label="${k}, ${o(st[k-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${k}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${o(l.id)}">
        <p class="dk__arvio-statement">${o(l.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${o(l.text)}">
          ${p}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),i=T.every(l=>Number.isInteger(t[l.id])&&t[l.id]>0),c=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${i?"":"disabled"}>Tallenna arvio</button>`,d=n?nt(s):"";return`
    <section class="dk__arvio" data-sivu="${o(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${T.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen \u2014 vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${d}
      <div class="dk__arvio-list">${a}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${c}</div>
    </section>`}function nt(e){let t=e?.ratings||{},s=T.map(i=>t[i.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((i,c)=>i+c,0)/s.length,a=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${o(a)}</p>
    </div>`}function se(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=fe(t),s.replaceWith(n.firstElementChild),ve()}function ve(){let e=document.querySelector(".dk__arvio");if(!e)return;let t=e.dataset.sivu,s=me(t);e.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.statement,i=Number(n.dataset.value);s[a]=i,e.querySelector(`.dk__arvio-row[data-statement="${a}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(l=>{let r=Number(l.dataset.value)===i;l.classList.toggle("is-chosen",r),l.setAttribute("aria-pressed",r?"true":"false")});let d=document.getElementById("dk-arvio-submit");if(d){let l=T.every(r=>Number.isInteger(s[r.id])&&s[r.id]>0);d.disabled=!l}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:u.lang,kurssiKey:u.kurssiKey,lessonIndex:u.lessonIndex};he(n),x(t),se(),M()&&A(`${S}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...E()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(J())}catch{}q.delete(t),se()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${u.lang}/${encodeURIComponent(u.kurssiKey)}`})}var V=new Map,w="know",ge="again";function D(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,oe)}function G(){return`${Re}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function W(){try{let e=localStorage.getItem(G());return e?JSON.parse(e):{}}catch{return{}}}function at(e,t){try{let s=W();s[e]=t,localStorage.setItem(G(),JSON.stringify(s))}catch{}}function it(){try{localStorage.removeItem(G())}catch{}}function ye(e){let t=V.get(e);return t||(t={cardIndex:0,flipped:!1},V.set(e,t)),t}function I(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function be(e){let t=D(f);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=W(),n=t.filter((h,m)=>s[I(h,m)]===w).length;if(n===t.length)return`
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
      </section>`;let i=ye(e.id),c=Math.min(i.cardIndex,t.length-1),l=$e(t,s,c)[0]??c,r=t[l],p=I(r,l),k=s[p]||null;return`
    <section class="dk__flashpack" data-sivu="${o(e.id)}" data-index="${l}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${l+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${rt(r,p,i.flipped,k)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function $e(e,t,s){let n=[];for(let a=s;a<e.length;a++){let i=I(e[a],a);t[i]!==w&&n.push(a)}for(let a=0;a<s;a++){let i=I(e[a],a);t[i]!==w&&n.push(a)}return n}function rt(e,t,s,n){let a=e.gender?`<span class="dk__flashcard-tag">${o(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=n===ge?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===w?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
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
    </div>`}function H(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=be(t),s.replaceWith(n.firstElementChild),xe()}function xe(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{it(),V.delete(t),H()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let l=b(u.sivuId),r=_[l+1];r&&L(r.id)}),e.dataset.done==="true")return;let s=ye(t),n=Number(e.dataset.index),a=D(f)[n];if(!a)return;let i=I(a,n),c=()=>{s.flipped=!s.flipped,H()};document.getElementById("dk-flashcard")?.addEventListener("click",c),document.getElementById("dk-flashcard")?.addEventListener("keydown",l=>{(l.key===" "||l.key==="Enter")&&(l.preventDefault(),c())}),document.getElementById("dk-flash-flip")?.addEventListener("click",c);let d=l=>{at(i,l),s.flipped=!1;let r=W(),p=D(f);p.length>0&&p.every((m,v)=>r[I(m,v)]===w)&&x(t);let h=$e(p,r,n+1<p.length?n+1:0);s.cardIndex=h[0]??n,H()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>d(ge)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>d(w))}var ne=new Map,we=new Set(["mc","typed","gap_fill","translate"]);function Ie(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(f?.phases)?f.phases:[])[s]||null}function Se(e,t){let s=ne.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},ne.set(e,s)),s}function Ee(e){let t=Ie(e);if(!t)return le(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(!we.has(n)){let l=n==="match"?"Yhdist\xE4misteht\xE4v\xE4, tulossa PR 4b":n==="writing"?"Kirjoitusteht\xE4v\xE4, tulossa PR 7":`Teht\xE4v\xE4tyyppi "${n}" tulossa my\xF6hemmin`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${o(l)}</p>
        <p>Vaihe ${o(String((ot(e)??0)+1))}: ${o(t.title||"")}. Vaiheessa ${s.length} teht\xE4v\xE4\xE4 t\xE4t\xE4 tyyppi\xE4.</p>
      </div>`}let a=Se(e.id,s),i=Math.min(a.itemIndex,s.length-1),c=s[i],d=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${o(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>
      </header>
      ${ct(c,d)}
      ${kt(c,d,i,s.length)}
    </section>`}function ot(e){let t=/^phase-(\d+)$/.exec(e.id);return t?Number(t[1]):null}function ct(e,t){switch(e.item_type){case"mc":return dt(e,t);case"typed":return lt(e,t);case"gap_fill":return ut(e,t);case"translate":return pt(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${o(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function dt(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${o(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((c,d)=>{let l=a&&i===d,r=a&&d===n,p=["dk__choice"];return l&&r?p.push("is-correct"):l&&!r?p.push("is-wrong"):a&&r&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${d}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+d)}</span>
              <span class="dk__choice-text">${o(c)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function lt(e,t){let s=e.hint||"",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-stem">${o(e.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${o(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${o(n)}"
             ${a?"disabled":""}>
    </div>`}function ut(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(n).fill(""),i=!!t,c=0,d=o(s).replace(/\{(\d+)\}/g,()=>{let r=a[c]||"",p=`dk-gap-${c}`;return c++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${c-1}" autocomplete="off" spellcheck="false"
                   value="${o(r)}" ${i?"disabled":""}>`}),l=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(r=>`
           <li>
             <button type="button" class="dk__wordbank-chip"
                     data-word="${o(r)}"
                     ${i?"disabled":""}>
               ${o(r)}
             </button>
           </li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${d}</p>
    ${l}`}function pt(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${o(s)}</p>
    <p class="dk__exercise-stem">${o(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${o(n)}</textarea>
    </div>`}function kt(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",c=a?"Oikein":"Viel\xE4 ei aivan",d=_t(e,t),l=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${c}</span>
      ${d}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${l?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function _t(e,t){let s=Ae(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${o(s)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${o(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${o(t.accentHint)}</p>`:"";return`${n}${i}${a}`}function Ae(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}default:return""}}function F(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let a of n){let i=O(s,a,u.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<n.length;i++){let c=Array.isArray(n[i])?n[i]:[n[i]],d=String(s[i]||"").trim(),l=!1;for(let r of c)if(O(d,String(r),u.lang||"es").ok){l=!0;break}if(!l){a=!1;break}}return{correct:a,userAnswer:s}}default:return{correct:!1}}}function ht(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);default:return null}}function N(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=Ee(t),s.replaceWith(n.firstElementChild),je()}function je(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=_.find(r=>r.id===t),n=Ie(s);if(!n)return;let a=n.items||[],i=Number(e.dataset.index),c=a[i];if(!c)return;let d=Se(t,a);e.querySelectorAll(".dk__choice").forEach(r=>{r.addEventListener("click",()=>{if(d.answered[i])return;let p=Number(r.dataset.choice),k=F(c,p);d.answered[i]=k,k.correct&&d.scoreCorrect++,d.scoreTotal++,d.scoreTotal>=a.length&&x(t),N()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(d.answered[i])return;let r=ht(c),p=F(c,r);d.answered[i]=p,p.correct&&d.scoreCorrect++,d.scoreTotal++,d.scoreTotal>=a.length&&x(t),N()}),e.querySelector("#dk-input")?.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&!d.answered[i]&&(r.preventDefault(),document.getElementById("dk-check")?.click())}),e.querySelectorAll(".dk__wordbank-chip").forEach(r=>{r.addEventListener("click",()=>{if(d.answered[i])return;let p=r.dataset.word||"",k=[...e.querySelectorAll(".dk__input--gap")],h=k.find(m=>!m.value.trim())||k[k.length-1];h&&(h.value=p,h.focus())})}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)d.itemIndex=i+1,N();else{let r=b(u.sivuId),p=_[r+1];p&&L(p.id)}})}function Te(){let e=f?.meta||{},t=b(u.sivuId),s=_[t],n=t>0?_[t-1]:null,a=t<_.length-1?_[t+1]:null,i=[e.course_key||u.kurssiKey,`Oppitunti ${e.lesson_index||u.lessonIndex}`].filter(Boolean).join(" \xB7 "),c=s.kind==="teoria"?`<em>${o(s.title)}</em>`:`${s.num?`${o(s.num)} \xB7 `:""}${o(s.title)}`,d=s.kind==="teoria"?Xe():s.kind==="tehtava"?Ee(s):s.kind==="flashcards"?be(s):s.kind==="testi"?ke(s):s.kind==="itsearviointi"?fe(s):le(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      <p class="dk__page-meta">${o(i)}</p>
      <h2 class="dk__page-title">${c}</h2>
      ${d}
      ${mt(n,a,"bottom")}
    </main>`}function mt(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${o(e.id)}">
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
            <p>${o(String(e?.message||e||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${o(u.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function C(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===g?"true":"false")}function gt(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===j?g:j;C(a)}else{let a=s.dataset.sidemenu===g?j:g;C(a),Ve(a)}}),t?.addEventListener("click",()=>{C(g)})}function L(e){if(!e||e===u.sivuId||_.findIndex(c=>c.id===e)<0)return;u.sivuId=e;let s=`#/oppitunti/${u.lang}/${encodeURIComponent(u.kurssiKey)}/${u.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(c=>{let d=c.dataset.sivu===e;c.classList.toggle("is-active",d),c.setAttribute("aria-current",d?"page":"false")});let i=n.querySelector(".dk__content");if(i){let c=document.createElement("div");c.innerHTML=Te(),i.replaceWith(c.firstElementChild),Le()}window.matchMedia("(max-width: 1023px)").matches&&C(g),Ce(),de(),U(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function yt(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&L(t.dataset.sivu)})}function Ce(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function Le(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>L(e.dataset.sivu))}),je(),xe(),_e(),ve()}function bt(){ce=!0}async function $t(e={}){ce||bt(),u.lang=e.lang||u.lang,u.kurssiKey=e.kurssiKey||u.kurssiKey,u.lessonIndex=Number(e.lessonIndex)||u.lessonIndex,u.sivuId=e.sivuId||u.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=ft(),z("screen-digikirja");let s=`${u.lang}/${u.kurssiKey}/${u.lessonIndex}`;P=s;try{let[n]=await Promise.all([Ue(u),Je(u)]);if(P!==s)return;f=n,_=Ye(n),_.some(c=>c.id===u.sivuId)||(u.sivuId=_[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?g:qe();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${Ge()}
        <div class="dk__body">
          ${We()}
          ${Te()}
        </div>
      </div>`,C(i),gt(),yt(),ze(),Le(),Ce(),de(),U()}catch(n){if(P!==s)return;t.innerHTML=vt(n)}}function At(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?($t({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{bt as initDigikirja,$t as showDigikirja,At as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-3V2RMOO5.js.map
