import{b as O}from"./app-chunk-AE7C6F2Z.js";import{a as E,c as K,d as B,e as A,j}from"./app-chunk-NZWTLFMY.js";import{b as z}from"./app-chunk-3WC2U67L.js";function Me(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function g(e){let t=Me(e);return t=t.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),t=t.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),t}function X(e){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(e)}function Z(e){return e.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function Be(e,t){let s=Z(e),n=t.map(Z),a=s.map(c=>`<th>${g(c)}</th>`).join(""),i=n.map(c=>`<tr>${c.map(l=>`<td>${g(l)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function Oe(e){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${e.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${g(n)}</p>`).join("")}</div>
    </aside>`}function He(e){return`<ul class="dk__teoria-ul">${e.map(s=>`<li>${g(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function Q(e){if(!e||typeof e!="string")return"";let t=e.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<t.length;){let i=t[n];if(/^\s*$/.test(i)){n++;continue}let d=/^(#{1,6})\s+(.*)$/.exec(i);if(d){let o=d[1].length,l=d[2].trim();if(o===1&&!a){a=!0,n++;continue}o===2?s.push(`<h3 class="dk__teoria-h2">${g(l)}</h3>`):o===3?s.push(`<h4 class="dk__teoria-h3">${g(l)}</h4>`):s.push(`<h${Math.min(o+1,6)} class="dk__teoria-h">${g(l)}</h${Math.min(o+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let o=[];for(;n<t.length&&/^\s*>\s?/.test(t[n]);)o.push(t[n]),n++;s.push(Oe(o));continue}if(/^\s*\|/.test(i)&&n+1<t.length&&X(t[n+1])){let o=i,l=[];for(n+=2;n<t.length&&/^\s*\|/.test(t[n]);)l.push(t[n]),n++;s.push(Be(o,l));continue}if(/^\s*[-*]\s+/.test(i)){let o=[];for(;n<t.length&&/^\s*[-*]\s+/.test(t[n]);)o.push(t[n]),n++;s.push(He(o));continue}let c=[i];for(n++;n<t.length&&!/^\s*$/.test(t[n])&&!/^(#{1,6})\s+/.test(t[n])&&!/^\s*>\s?/.test(t[n])&&!/^\s*[-*]\s+/.test(t[n])&&!(/^\s*\|/.test(t[n])&&n+1<t.length&&X(t[n+1]));)c.push(t[n]),n++;s.push(`<p class="dk__teoria-p">${g(c.join(" "))}</p>`)}return s.join(`
`)}var ae="puheo:dk:sidemenu",x="open",y="collapsed",Ne="puheo:dk:progress";function ie(){return`${Ne}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function M(){try{return JSON.parse(localStorage.getItem(ie())||"{}")}catch{return{}}}function re(e){try{localStorage.setItem(ie(),JSON.stringify(e))}catch{}}function w(e){if(!e)return;let t=M();t[e]!=="done"&&(t[e]="done",re(t),K()&&j(`${E}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...A()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,sivuId:e})}).catch(()=>{}),U())}function U(){let e=M(),t=document.getElementById("dk-sidemenu-list");t&&t.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",e[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=_.filter(a=>e[a.id]==="done").length;s.textContent=`${n} / ${_.length} valmis`,s.dataset.full=n>=_.length?"true":"false"}}var Pe=[[/^YO-tyylinen käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^YO-tason käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lyhyt kirjoitus$/i,"Kirjoita lyhyt teksti"],[/^Lauseiden rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lauseen rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/Lauseen täydennys\s*[—-]\s*/g,"Lauseen t\xE4ydennys, "],[/Tunnista\s*[—-]\s*/g,"Tunnista "],[/Tuota\s*[—-]\s*/g,"Tuota "],[/Yhdistä\s*[—-]\s*/g,"Yhdist\xE4 "],[/Käännä\s*[—-]\s*/g,"K\xE4\xE4nn\xE4 "]];function Re(e){if(!e)return"";let t=String(e);for(let[s,n]of Pe)t=t.replace(s,n);return t=t.replace(/\s+—\s+/g,", "),t}var qe={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"};var oe=5,Fe="puheo:dk:flashcards",ee={},de=!1,u={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},v=null,_=[],H="";function r(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function Ve(){try{return localStorage.getItem(ae)===x?x:y}catch{return x}}function De(e){try{localStorage.setItem(ae,e)}catch{}}function Ue(e){return e==="fr"?"Ranska":e==="de"?"Saksa":"Espanja"}function Ye(e){return`/data/courses/${encodeURIComponent(e.lang)}/${encodeURIComponent(e.kurssiKey)}/lesson_${encodeURIComponent(e.lessonIndex)}.json`}async function Je(e){let t=Ye(e),s=await fetch(t,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function We(e){if(K())try{let t=`lang=${encodeURIComponent(e.lang)}&kurssi=${encodeURIComponent(e.kurssiKey)}&lesson=${encodeURIComponent(e.lessonIndex)}`,[s,n]=await Promise.all([j(`${E}/api/digikirja/progress?${t}`,{headers:A()}).catch(()=>null),j(`${E}/api/digikirja/itsearvio?${t}`,{headers:A()}).catch(()=>null)]);if(s?.ok){let{sivut:a}=await s.json().catch(()=>({sivut:{}}));if(a&&typeof a=="object"){let i=M();for(let d of Object.keys(a))i[d]||(i[d]="done");re(i)}}if(n?.ok){let{itsearvio:a}=await n.json().catch(()=>({itsearvio:null}));a?.ratings&&(J()||he({ratings:a.ratings,submittedAt:a.submittedAt,lang:e.lang,kurssiKey:e.kurssiKey,lessonIndex:e.lessonIndex}))}}catch{}}function Ge(e){let t=[];t.push({id:"teoria",kind:"teoria",num:"",title:e?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(e?.phases)?e.phases:[]).forEach((i,d)=>{let c=String(d+1),o=Re(i.title)||`Vaihe ${c}`,l=Array.isArray(i.items)?i.items.length:0;t.push({id:`phase-${d}`,kind:"tehtava",num:c,title:o,meta:l?`${l} kohtaa`:"Teht\xE4v\xE4"})});let n=Array.isArray(e?.vocab)?e.vocab:[],a=Math.min(n.length,oe);return a>0&&t.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${e?.meta?.title||""}`.trim(),meta:`${a} korttia`}),t}function b(e){let t=_.findIndex(s=>s.id===e);return t>=0?t:0}function ze(){let t=(v?.meta||{}).title||"Oppitunti";return`
    <header class="dk__topbar" role="banner">
      <div class="dk__topbar-left">
        <button type="button" class="dk__tool dk__tool--invert" id="dk-toggle-sidemenu"
                aria-label="Avaa tai sulje sis\xE4llysluettelo"
                aria-pressed="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="14" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
        <button type="button" class="dk__home" data-dk-nav="home" aria-label="Palaa Aloitukseen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m3 11 9-8 9 8"/>
            <path d="M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9"/>
          </svg>
          <span>Aloitus</span>
        </button>
      </div>
      <h1 class="dk__title">${r(t)}</h1>
      <div class="dk__tools">
        <span class="dk__progress-chip" id="dk-progress-chip" aria-live="polite">0 / 0 valmis</span>
        <button type="button" class="dk__tool dk__tool--invert" id="dk-search" aria-label="Etsi" title="Etsi (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
        </button>
        <button type="button" class="dk__tool dk__tool--invert" id="dk-help" aria-label="Opas" title="Opas (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2"/>
            <circle cx="12" cy="17" r="0.5"/>
          </svg>
        </button>
      </div>
    </header>`}function Xe(){let e=[],t=null;for(let c of _){let o=qe[c.kind]||"Muut";o!==t&&(e.push({title:o,items:[]}),t=o),e[e.length-1].items.push(c)}let s=M(),n=e.map(c=>{let o=`<span class="dk__group-title">${r(c.title)}</span>`,l=c.items.map(p=>{let k=p.id===u.sivuId,h=s[p.id]==="done",m=["dk__row"];k&&m.push("is-active"),h&&m.push("is-done");let f=p.num?`${r(p.num)} `:"";return`
        <button type="button"
                class="${m.join(" ")}"
                data-sivu="${r(p.id)}"
                data-kind="${r(p.kind)}"
                aria-current="${k?"page":"false"}"
                aria-label="${r(p.title)}${h?", suoritettu":""}">
          <span class="dk__row-bullet" aria-hidden="true"></span>
          <span class="dk__row-title">${f}${r(p.title)}</span>
          ${h?'<span class="dk__row-check" aria-hidden="true">\u2713</span>':""}
        </button>`}).join("");return o+l}).join(""),a=(window._userProfile?.nickname||"").trim();if(!a)try{a=(localStorage.getItem("puheo:nickname")||"").trim()}catch{}let i=typeof B=="function"&&B()||"",d=a||i||"Oma sivu";return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-top">
        <a class="dk__sidemenu-logo" href="#home" data-dk-nav="home" aria-label="Puheo etusivulle">Puhe<span>o</span></a>
        <div class="dk__sidemenu-course">${r(Ue(u.lang))} \xB7 ${r(u.kurssiKey||"")}</div>
      </div>
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${_.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
      <div class="dk__sidemenu-footer">
        <button type="button" class="dk__sidemenu-user" data-dk-nav="profile" title="${r(d)}">
          <span class="dk__sidemenu-user-text">${r(d)}</span>
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
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function Ze(){let e=document.getElementById("dk-root");e&&e.addEventListener("click",t=>{let s=t.target.closest("[data-dk-nav]");if(!s)return;let n=s.dataset.dkNav;s.tagName==="A"&&t.preventDefault(),n==="home"?document.querySelector('.sidebar-item[data-nav="home"]')?.click()??(location.hash="#home"):n==="settings"?document.querySelector('.sidebar-item[data-nav="settings"]')?.click():n==="profile"?document.querySelector('.sidebar-user[data-nav="profile"], .sidebar-item[data-nav="profile"]')?.click():n==="logout"&&document.getElementById("sidebar-logout")?.click()})}function ce(){u.sivuId==="teoria"&&w("teoria")}function Qe(){let e=v?.teaching||{},t=e.intro_md||"",s=Array.isArray(e.key_points)?e.key_points:[],n=Q(t)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${r(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function le(e){let t=ee[e.kind]||ee.flashcards;return`
    <div class="dk__placeholder" data-kind="${r(e.kind)}">
      <p class="dk__placeholder-kind">${r(t.label)}</p>
      <p>${r(t.body)}</p>
    </div>`}var R=new Map;function ue(e){let t=e?.testDef;return t?((Array.isArray(v?.phases)?v.phases:[])[t.sourcePhase]?.items||[]).slice(0,t.count).filter(a=>we.has(a.item_type)):[]}function pe(e,t){let s=R.get(e);return s||(s={submitted:!1,answers:t.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:t.map(()=>null),scoreCorrect:0},R.set(e,s)),s}function ke(e){let t=ue(e);if(t.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=pe(e.id,t),n=e.testDef?.label||e.title||"Testi",a=t.map((c,o)=>et(c,o,s)).join(""),i=s.submitted?tt(t,s):"",d=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${r(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${r(n)}</span>
        <span class="dk__exercise-score">${t.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${d}</div>
    </section>`}function et(e,t,s){let n=s.submitted,a=s.results[t],i=e.item_type==="translate"?e.source||"":e.item_type==="typed"?e.prompt||"":e.item_type==="gap_fill"?null:e.stem||"",d=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${t+1}</span>`,c="";switch(e.item_type){case"mc":{let l=n?a?.choiceIndex:s.answers[t]===null?-1:s.answers[t],p=e.correct_index;c=`
        <p class="dk__exercise-stem dk__testi-stem">${r(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(e.choices||[]).map((k,h)=>{let m=l===h,f=h===p,$=["dk__choice"];return n?m&&f?$.push("is-correct"):m&&!f?$.push("is-wrong"):f&&$.push("is-revealed"):m&&$.push("is-selected"),`
              <li>
                <button type="button" class="${$.join(" ")}"
                        data-testi-item="${t}" data-choice="${h}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+h)}</span>
                  <span class="dk__choice-text">${r(k)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let l=n?a?.userAnswer||"":s.answers[t]||"";c=`
        <p class="dk__exercise-stem dk__testi-stem">${r(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${t}">Vastauksesi</label>
          <${e.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${t}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${t}" type="text" class="dk__input"`}
                  data-testi-item="${t}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${e.item_type==="translate"?`>${r(l)}</textarea>`:` value="${r(l)}">`}
        </div>`;break}case"gap_fill":{let l=String(e.sentence_template||""),p=n?a?.userAnswer||[]:s.answers[t]||[],k=0,h=r(l).replace(/\{(\d+)\}/g,()=>{let f=p[k]||"",$=`dk-testi-${t}-gap-${k}`,Ke=k;return k++,`<input id="${$}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${t}" data-testi-gap="${Ke}"
                       autocomplete="off" spellcheck="false"
                       value="${r(f)}" ${n?"disabled":""}>`}),m=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${e.word_bank.map(f=>`<li><span>${r(f)}</span></li>`).join("")}
           </ul>`:"";c=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${h}</p>${m}`;break}default:c=`<p>${r(i)}</p>`}let o=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${r(Ae(e)||"")}</p>`}
         ${e.explanation?`<p class="dk__feedback-text">${r(e.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${t}">
      <div class="dk__testi-itemhead">
        ${d}
      </div>
      <div class="dk__testi-itembody">
        ${c}
        ${o}
      </div>
    </li>`}function tt(e,t){let s=e.length,n=t.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku. Kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${r(i)}</p>
    </div>`}function st(e,t){return e.map((n,a)=>{switch(n.item_type){case"mc":return t.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(d=>d.value);default:return null}})}function te(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=ke(t),s.replaceWith(n.firstElementChild),_e()}function _e(){let e=document.querySelector(".dk__testi");if(!e)return;let t=e.dataset.sivu,s=_.find(i=>i.id===t),n=ue(s),a=pe(t,n);e.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let d=Number(i.dataset.testiItem),c=Number(i.dataset.choice);a.answers[d]=c,e.querySelector(`.dk__testi-item[data-testi-item="${d}"]`)?.querySelectorAll(".dk__choice").forEach(l=>{l.classList.toggle("is-selected",Number(l.dataset.choice)===c)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=st(n,a);let i=0;a.results=n.map((d,c)=>{let o=D(d,a.answers[c]);return o.correct&&i++,o}),a.scoreCorrect=i,a.submitted=!0,w(t),te(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{R.delete(t),te()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=b(u.sivuId),d=_[i+1];d&&C(d.id)})}var nt="puheo:dk:itsearvio",L=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],at=["heikko","vajaa","kohtuu","vahva","hallitsen"];function Y(){return`${nt}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function J(){try{return JSON.parse(localStorage.getItem(Y())||"null")}catch{return null}}function he(e){try{localStorage.setItem(Y(),JSON.stringify(e))}catch{}}var q=new Map;function me(e){let t=q.get(e);return t||(t={...J()?.ratings||{}},q.set(e,t)),t}function fe(e){let t=me(e.id),s=J(),n=!!s,a=L.map(o=>{let l=n?s.ratings?.[o.id]??0:t[o.id]??0,p=[1,2,3,4,5].map(k=>`
      <button type="button"
              class="dk__arvio-btn ${l===k?"is-chosen":""}"
              data-statement="${r(o.id)}"
              data-value="${k}"
              aria-pressed="${l===k}"
              aria-label="${k}, ${r(at[k-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${k}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${r(o.id)}">
        <p class="dk__arvio-statement">${r(o.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${r(o.text)}">
          ${p}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),i=L.every(o=>Number.isInteger(t[o.id])&&t[o.id]>0),d=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${i?"":"disabled"}>Tallenna arvio</button>`,c=n?it(s):"";return`
    <section class="dk__arvio" data-sivu="${r(e.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${L.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen, vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${c}
      <div class="dk__arvio-list">${a}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${d}</div>
    </section>`}function it(e){let t=e?.ratings||{},s=L.map(i=>t[i.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((i,d)=>i+d,0)/s.length,a=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${r(a)}</p>
    </div>`}function se(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=fe(t),s.replaceWith(n.firstElementChild),ve()}function ve(){let e=document.querySelector(".dk__arvio");if(!e)return;let t=e.dataset.sivu,s=me(t);e.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.statement,i=Number(n.dataset.value);s[a]=i,e.querySelector(`.dk__arvio-row[data-statement="${a}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(o=>{let l=Number(o.dataset.value)===i;o.classList.toggle("is-chosen",l),o.setAttribute("aria-pressed",l?"true":"false")});let c=document.getElementById("dk-arvio-submit");if(c){let o=L.every(l=>Number.isInteger(s[l.id])&&s[l.id]>0);c.disabled=!o}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:u.lang,kurssiKey:u.kurssiKey,lessonIndex:u.lessonIndex};he(n),w(t),se(),K()&&j(`${E}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...A()},body:JSON.stringify({lang:u.lang,kurssi:u.kurssiKey,lesson:u.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(Y())}catch{}q.delete(t),se()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${u.lang}/${encodeURIComponent(u.kurssiKey)}`})}var F=new Map,I="know",ge="again";function V(e){return(Array.isArray(e?.vocab)?e.vocab:[]).slice(0,oe)}function W(){return`${Fe}:${u.lang}:${u.kurssiKey}:${u.lessonIndex}`}function G(){try{let e=localStorage.getItem(W());return e?JSON.parse(e):{}}catch{return{}}}function rt(e,t){try{let s=G();s[e]=t,localStorage.setItem(W(),JSON.stringify(s))}catch{}}function ot(){try{localStorage.removeItem(W())}catch{}}function ye(e){let t=F.get(e);return t||(t={cardIndex:0,flipped:!1},F.set(e,t)),t}function S(e,t){return e?.es?`${t}:${e.es}`:`${t}`}function be(e){let t=V(v);if(t.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=G(),n=t.filter((h,m)=>s[S(h,m)]===I).length;if(n===t.length)return`
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
      </section>`;let i=ye(e.id),d=Math.min(i.cardIndex,t.length-1),o=$e(t,s,d)[0]??d,l=t[o],p=S(l,o),k=s[p]||null;return`
    <section class="dk__flashpack" data-sivu="${r(e.id)}" data-index="${o}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${o+1} / ${t.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${t.length} hallinnassa</span>
      </header>
      ${dt(l,p,i.flipped,k)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function $e(e,t,s){let n=[];for(let a=s;a<e.length;a++){let i=S(e[a],a);t[i]!==I&&n.push(a)}for(let a=0;a<s;a++){let i=S(e[a],a);t[i]!==I&&n.push(a)}return n}function dt(e,t,s,n){let a=e.gender?`<span class="dk__flashcard-tag">${r(e.gender==="m"?"Maskuliini":e.gender==="f"?"Feminiini":e.gender)}</span>`:"",i=n===ge?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===I?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
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
    </div>`}function N(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=be(t),s.replaceWith(n.firstElementChild),xe()}function xe(){let e=document.querySelector(".dk__flashpack");if(!e)return;let t=e.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{ot(),F.delete(t),N()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let o=b(u.sivuId),l=_[o+1];l&&C(l.id)}),e.dataset.done==="true")return;let s=ye(t),n=Number(e.dataset.index),a=V(v)[n];if(!a)return;let i=S(a,n),d=()=>{s.flipped=!s.flipped,N()};document.getElementById("dk-flashcard")?.addEventListener("click",d),document.getElementById("dk-flashcard")?.addEventListener("keydown",o=>{(o.key===" "||o.key==="Enter")&&(o.preventDefault(),d())}),document.getElementById("dk-flash-flip")?.addEventListener("click",d);let c=o=>{rt(i,o),s.flipped=!1;let l=G(),p=V(v);p.length>0&&p.every((m,f)=>l[S(m,f)]===I)&&w(t);let h=$e(p,l,n+1<p.length?n+1:0);s.cardIndex=h[0]??n,N()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>c(ge)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>c(I))}var ne=new Map,we=new Set(["mc","typed","gap_fill","translate"]);function Ie(e){if(!e||e.kind!=="tehtava")return null;let t=/^phase-(\d+)$/.exec(e.id);if(!t)return null;let s=Number(t[1]);return(Array.isArray(v?.phases)?v.phases:[])[s]||null}function Se(e,t){let s=ne.get(e);return s||(s={itemIndex:0,answered:new Array(t.length).fill(null),scoreCorrect:0,scoreTotal:0},ne.set(e,s)),s}function Ee(e){let t=Ie(e);if(!t)return le(e);let s=Array.isArray(t.items)?t.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(!we.has(n)){let o=n==="match"?"Yhdist\xE4misteht\xE4v\xE4":n==="writing"?"Kirjoitusteht\xE4v\xE4":`Teht\xE4v\xE4tyyppi "${n}"`;return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${r(o)}</p>
        <p>T\xE4m\xE4 teht\xE4v\xE4tyyppi avautuu pian. Voit jatkaa muista vaiheista sivuvalikosta.</p>
      </div>`}let a=Se(e.id,s),i=Math.min(a.itemIndex,s.length-1),d=s[i],c=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${r(e.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>
      </header>
      ${ct(d,c)}
      ${_t(d,c,i,s.length)}
    </section>`}function ct(e,t){switch(e.item_type){case"mc":return lt(e,t);case"typed":return ut(e,t);case"gap_fill":return pt(e,t);case"translate":return kt(e,t);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${r(e.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function lt(e,t){let s=Array.isArray(e.choices)?e.choices:[],n=Number.isInteger(e.correct_index)?e.correct_index:-1,a=!!t,i=t?.choiceIndex;return`
    <p class="dk__exercise-stem">${r(e.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((d,c)=>{let o=a&&i===c,l=a&&c===n,p=["dk__choice"];return o&&l?p.push("is-correct"):o&&!l?p.push("is-wrong"):a&&l&&p.push("is-revealed"),`
          <li>
            <button type="button" class="${p.join(" ")}"
                    data-choice="${c}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+c)}</span>
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
    </div>`}function pt(e,t){let s=String(e.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=t?.userAnswer||new Array(n).fill(""),i=!!t,d=0,c=r(s).replace(/\{(\d+)\}/g,()=>{let l=a[d]||"",p=`dk-gap-${d}`;return d++,`<input id="${p}" type="text" class="dk__input dk__input--gap"
                   data-gap="${d-1}" autocomplete="off" spellcheck="false"
                   value="${r(l)}" ${i?"disabled":""}>`}),o=Array.isArray(e.word_bank)&&e.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${e.word_bank.map(l=>`
           <li>
             <button type="button" class="dk__wordbank-chip"
                     data-word="${r(l)}"
                     ${i?"disabled":""}>
               ${r(l)}
             </button>
           </li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${c}</p>
    ${o}`}function kt(e,t){let s=e.direction==="es_to_fi"?"espanjasta suomeksi":e.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=t?.userAnswer||"",a=!!t;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${r(s)}</p>
    <p class="dk__exercise-stem">${r(e.source||e.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${r(n)}</textarea>
    </div>`}function _t(e,t,s,n){if(!t)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=t.correct,i=a?"is-correct":"is-wrong",d=a?"Oikein":"Viel\xE4 ei aivan",c=ht(e,t),o=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${d}</span>
      ${c}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${o?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function ht(e,t){let s=Ae(e),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${r(s)}</p>`:"",a=e.explanation?`<p class="dk__feedback-text">${r(e.explanation)}</p>`:"",i=t?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${r(t.accentHint)}</p>`:"";return`${n}${i}${a}`}function Ae(e){switch(e.item_type){case"mc":return Array.isArray(e.choices)&&Number.isInteger(e.correct_index)?e.choices[e.correct_index]:"";case"typed":return Array.isArray(e.accept)&&e.accept[0]||"";case"translate":return Array.isArray(e.accept)&&e.accept[0]||"";case"gap_fill":{let t=String(e.sentence_template||""),s=Array.isArray(e.answers)?e.answers:[],n=0;return t.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}default:return""}}function D(e,t){switch(e.item_type){case"mc":{let s=Number(t);return{correct:s===e.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(t||"").trim(),n=Array.isArray(e.accept)?e.accept:[];for(let a of n){let i=O(s,a,u.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(t)?t:[],n=Array.isArray(e.answers)?e.answers:[],a=!0;for(let i=0;i<n.length;i++){let d=Array.isArray(n[i])?n[i]:[n[i]],c=String(s[i]||"").trim(),o=!1;for(let l of d)if(O(c,String(l),u.lang||"es").ok){o=!0;break}if(!o){a=!1;break}}return{correct:a,userAnswer:s}}default:return{correct:!1}}}function mt(e){let t=document.querySelector(".dk__exercise");if(!t)return null;switch(e.item_type){case"typed":case"translate":{let s=t.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...t.querySelectorAll(".dk__input--gap")].map(s=>s.value);default:return null}}function P(){let e=b(u.sivuId),t=_[e],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=Ee(t),s.replaceWith(n.firstElementChild),je()}function je(){let e=document.querySelector(".dk__exercise");if(!e)return;let t=e.dataset.sivu,s=_.find(l=>l.id===t),n=Ie(s);if(!n)return;let a=n.items||[],i=Number(e.dataset.index),d=a[i];if(!d)return;let c=Se(t,a);e.querySelectorAll(".dk__choice").forEach(l=>{l.addEventListener("click",()=>{if(c.answered[i])return;let p=Number(l.dataset.choice),k=D(d,p);c.answered[i]=k,k.correct&&c.scoreCorrect++,c.scoreTotal++,c.scoreTotal>=a.length&&w(t),P()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(c.answered[i])return;let l=mt(d),p=D(d,l);c.answered[i]=p,p.correct&&c.scoreCorrect++,c.scoreTotal++,c.scoreTotal>=a.length&&w(t),P()}),e.querySelector("#dk-input")?.addEventListener("keydown",l=>{l.key==="Enter"&&!l.shiftKey&&!c.answered[i]&&(l.preventDefault(),document.getElementById("dk-check")?.click())}),e.querySelectorAll(".dk__wordbank-chip").forEach(l=>{l.addEventListener("click",()=>{if(c.answered[i])return;let p=l.dataset.word||"",k=[...e.querySelectorAll(".dk__input--gap")],h=k.find(m=>!m.value.trim())||k[k.length-1];h&&(h.value=p,h.focus())})}),document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)c.itemIndex=i+1,P();else{let l=b(u.sivuId),p=_[l+1];p&&C(p.id)}})}function Le(){let e=v?.meta||{},t=b(u.sivuId),s=_[t],n=t>0?_[t-1]:null,a=t<_.length-1?_[t+1]:null,i=[e.course_key||u.kurssiKey,`Oppitunti ${e.lesson_index||u.lessonIndex}`].filter(Boolean).join(" \xB7 "),d=s.kind==="teoria"?`<em>${r(s.title)}</em>`:`${s.num?`${r(s.num)} \xB7 `:""}${r(s.title)}`,c=s.kind==="teoria"?Qe():s.kind==="tehtava"?Ee(s):s.kind==="flashcards"?be(s):s.kind==="testi"?ke(s):s.kind==="itsearviointi"?fe(s):le(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      <p class="dk__page-meta">${r(i)}</p>
      <h2 class="dk__page-title">${d}</h2>
      ${c}
      ${ft(n,a,"bottom")}
    </main>`}function ft(e,t,s){let n=`dk__prevnext dk__prevnext--${s}`,a=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${r(e.id)}">
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
       </button>`;return`<div class="${n}">${a}${i}</div>`}function vt(){return`
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
    </div>`}function gt(e){return`
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
    </div>`}function T(e){let t=document.getElementById("dk-root");if(!t)return;t.dataset.sidemenu=e;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",e===y?"true":"false")}function yt(){let e=document.getElementById("dk-toggle-sidemenu"),t=document.getElementById("dk-sidemenu-backdrop");e?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===x?y:x;T(a)}else{let a=s.dataset.sidemenu===y?x:y;T(a),De(a)}}),t?.addEventListener("click",()=>{T(y)})}function C(e){if(!e||e===u.sivuId||_.findIndex(d=>d.id===e)<0)return;u.sivuId=e;let s=`#/oppitunti/${u.lang}/${encodeURIComponent(u.kurssiKey)}/${u.lessonIndex}/${encodeURIComponent(e)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(d=>{let c=d.dataset.sivu===e;d.classList.toggle("is-active",c),d.setAttribute("aria-current",c?"page":"false")});let i=n.querySelector(".dk__content");if(i){let d=document.createElement("div");d.innerHTML=Le(),i.replaceWith(d.firstElementChild),Ce()}window.matchMedia("(max-width: 1023px)").matches&&T(y),Te(),ce(),U(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function bt(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",e=>{let t=e.target.closest(".dk__row");t&&C(t.dataset.sivu)})}function Te(){let e=document.getElementById("dk-sidemenu-list");if(!e)return;let t=e.querySelector(".dk__row.is-active");t&&requestAnimationFrame(()=>{try{t.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=t.offsetTop-e.clientHeight/2+t.clientHeight/2;e.scrollTop=Math.max(0,s)}})}function Ce(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(e=>{e.addEventListener("click",()=>C(e.dataset.sivu))}),je(),xe(),_e(),ve()}function $t(){de=!0}async function xt(e={}){de||$t(),u.lang=e.lang||u.lang,u.kurssiKey=e.kurssiKey||u.kurssiKey,u.lessonIndex=Number(e.lessonIndex)||u.lessonIndex,u.sivuId=e.sivuId||u.sivuId||"teoria";let t=document.getElementById("screen-digikirja");if(!t)return;t.innerHTML=vt(),z("screen-digikirja"),import("./app-sidebarShell-SUJT3RRW.js").then(n=>n.setSidebarMode("book"));let s=`${u.lang}/${u.kurssiKey}/${u.lessonIndex}`;H=s;try{let[n]=await Promise.all([Je(u),We(u)]);if(H!==s)return;v=n,_=Ge(n),_.some(d=>d.id===u.sivuId)||(u.sivuId=_[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?y:Ve();t.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${ze()}
        <div class="dk__body">
          ${Xe()}
          ${Le()}
        </div>
      </div>`,T(i),yt(),bt(),Ze(),Ce(),Te(),ce(),U()}catch(n){if(H!==s)return;t.innerHTML=gt(n)}}function jt(e){let t=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(e||location.hash);return t?(xt({lang:t[1].toLowerCase(),kurssiKey:decodeURIComponent(t[2]),lessonIndex:Number(t[3]),sivuId:decodeURIComponent(t[4])}),!0):!1}export{$t as initDigikirja,xt as showDigikirja,jt as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-HIAEK4PU.js.map
