import{a as ot}from"./app-chunk-XYSTN2TU.js";import{b as V}from"./app-chunk-AE7C6F2Z.js";import{a as S,c as q,d as N,e as I,j as A}from"./app-chunk-YZSB43V2.js";import{b as rt}from"./app-chunk-PXMVMW5B.js";function te(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function b(t){let e=te(t);return e=e.replace(/`([^`]+)`/g,'<code class="dk__teoria-code">$1</code>'),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*\n]+)\*/g,"<em>$1</em>"),e=e.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g,"$1<em>$2</em>"),e}function ct(t){return/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(t)}function dt(t){return t.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim())}function ee(t,e){let s=dt(t),n=e.map(dt),a=s.map(o=>`<th>${b(o)}</th>`).join(""),i=n.map(o=>`<tr>${o.map(c=>`<td>${b(c)}</td>`).join("")}</tr>`).join("");return`<div class="dk__bilingual${s.length===2?" dk__bilingual--2col":""}"><table><thead><tr>${a}</tr></thead><tbody>${i}</tbody></table></div>`}function se(t){return`
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${t.map(n=>n.replace(/^>\s?/,"")).join(" ").trim().split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g).map(n=>n.trim()).filter(Boolean).map(n=>`<p>${b(n)}</p>`).join("")}</div>
    </aside>`}function ne(t){return`<ul class="dk__teoria-ul">${t.map(s=>`<li>${b(s.replace(/^[-*]\s+/,""))}</li>`).join("")}</ul>`}function lt(t){if(!t||typeof t!="string")return"";let e=t.replace(/\r\n?/g,`
`).split(`
`),s=[],n=0,a=!1;for(;n<e.length;){let i=e[n];if(/^\s*$/.test(i)){n++;continue}let r=/^(#{1,6})\s+(.*)$/.exec(i);if(r){let l=r[1].length,c=r[2].trim();if(l===1&&!a){a=!0,n++;continue}l===2?s.push(`<h3 class="dk__teoria-h2">${b(c)}</h3>`):l===3?s.push(`<h4 class="dk__teoria-h3">${b(c)}</h4>`):s.push(`<h${Math.min(l+1,6)} class="dk__teoria-h">${b(c)}</h${Math.min(l+1,6)}>`),n++;continue}if(/^\s*>\s?/.test(i)){let l=[];for(;n<e.length&&/^\s*>\s?/.test(e[n]);)l.push(e[n]),n++;s.push(se(l));continue}if(/^\s*\|/.test(i)&&n+1<e.length&&ct(e[n+1])){let l=i,c=[];for(n+=2;n<e.length&&/^\s*\|/.test(e[n]);)c.push(e[n]),n++;s.push(ee(l,c));continue}if(/^\s*[-*]\s+/.test(i)){let l=[];for(;n<e.length&&/^\s*[-*]\s+/.test(e[n]);)l.push(e[n]),n++;s.push(ne(l));continue}let o=[i];for(n++;n<e.length&&!/^\s*$/.test(e[n])&&!/^(#{1,6})\s+/.test(e[n])&&!/^\s*>\s?/.test(e[n])&&!/^\s*[-*]\s+/.test(e[n])&&!(/^\s*\|/.test(e[n])&&n+1<e.length&&ct(e[n+1]));)o.push(e[n]),n++;s.push(`<p class="dk__teoria-p">${b(o.join(" "))}</p>`)}return s.join(`
`)}var ft="puheo:dk:sidemenu",E="open",$="collapsed",ae="puheo:dk:progress";function vt(){return`${ae}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function B(){try{return JSON.parse(localStorage.getItem(vt())||"{}")}catch{return{}}}function gt(t){try{localStorage.setItem(vt(),JSON.stringify(t))}catch{}}function x(t){if(!t)return;let e=B();e[t]!=="done"&&(e[t]="done",gt(e),q()&&A(`${S}/api/digikirja/progress`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,sivuId:t})}).catch(()=>{}),Q())}function Q(){let t=B(),e=document.getElementById("dk-sidemenu-list");e&&e.querySelectorAll(".dk__row").forEach(n=>{n.classList.toggle("is-done",t[n.dataset.sivu]==="done")});let s=document.getElementById("dk-progress-chip");if(s){let n=f.filter(a=>t[a.id]==="done").length;s.textContent=`${n} / ${f.length} valmis`,s.dataset.full=n>=f.length?"true":"false"}}var ie=[[/^YO-tyylinen käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^YO-tason käännös$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lyhyt kirjoitus$/i,"Kirjoita lyhyt teksti"],[/^Lauseiden rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/^Lauseen rakentelua$/i,"K\xE4\xE4nn\xE4 lauseet"],[/Lauseen täydennys\s*[—-]\s*/g,"Lauseen t\xE4ydennys, "],[/Tunnista\s*[—-]\s*/g,"Tunnista "],[/Tuota\s*[—-]\s*/g,"Tuota "],[/Yhdistä\s*[—-]\s*/g,"Yhdist\xE4 "],[/Käännä\s*[—-]\s*/g,"K\xE4\xE4nn\xE4 "]];function re(t){if(!t)return"";let e=String(t);for(let[s,n]of ie)e=e.replace(s,n);return e=e.replace(/\s+—\s+/g,", "),e}var oe={teoria:"Opetus",tehtava:"Harjoitukset",flashcards:"Kortit",testi:"Testit",itsearviointi:"Itsearvio"};var yt=5,ce="puheo:dk:flashcards",ut={},bt=!1,p={lang:"es",kurssiKey:"kurssi_2",lessonIndex:3,sivuId:"teoria"},g=null,f=[],D="";function d(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function de(t){let e=[...t];for(let s=e.length-1;s>0;s--){let n=Math.floor(Math.random()*(s+1));[e[s],e[n]]=[e[n],e[s]]}return e}function le(){try{return localStorage.getItem(ft)===E?E:$}catch{return E}}function ue(t){try{localStorage.setItem(ft,t)}catch{}}function pe(t){return t==="fr"?"Ranska":t==="de"?"Saksa":"Espanja"}function $t(t){let e=/^kurssi_(\d+)$/.exec(String(t||""));return e?`Kurssi ${e[1]}`:t||""}function _e(t){return`/data/courses/${encodeURIComponent(t.lang)}/${encodeURIComponent(t.kurssiKey)}/lesson_${encodeURIComponent(t.lessonIndex)}.json`}async function ke(t){let e=_e(t),s=await fetch(e,{headers:{accept:"application/json"}});if(!s.ok)throw new Error(`lesson fetch ${s.status}`);return s.json()}async function he(t){if(q())try{let e=`lang=${encodeURIComponent(t.lang)}&kurssi=${encodeURIComponent(t.kurssiKey)}&lesson=${encodeURIComponent(t.lessonIndex)}`,[s,n]=await Promise.all([A(`${S}/api/digikirja/progress?${e}`,{headers:I()}).catch(()=>null),A(`${S}/api/digikirja/itsearvio?${e}`,{headers:I()}).catch(()=>null)]);if(s?.ok){let{sivut:a}=await s.json().catch(()=>({sivut:{}}));if(a&&typeof a=="object"){let i=B();for(let r of Object.keys(a))i[r]||(i[r]="done");gt(i)}}if(n?.ok){let{itsearvio:a}=await n.json().catch(()=>({itsearvio:null}));a?.ratings&&(et()||Lt({ratings:a.ratings,submittedAt:a.submittedAt,lang:t.lang,kurssiKey:t.kurssiKey,lessonIndex:t.lessonIndex}))}}catch{}}function me(t){let e=[];e.push({id:"teoria",kind:"teoria",num:"",title:t?.meta?.title||"Opetus",meta:"Opetussivu"}),(Array.isArray(t?.phases)?t.phases:[]).forEach((o,l)=>{let c=String(l+1),u=re(o.title)||`Vaihe ${c}`,_=Array.isArray(o.items)?o.items.length:0;e.push({id:`phase-${l}`,kind:"tehtava",num:c,title:u,meta:_?`${_} kohtaa`:"Teht\xE4v\xE4"})});let n=t?.meta?.lesson_type||"vocab",a=new Set(["vocab","mixed"]),i=Array.isArray(t?.vocab)?t.vocab:[],r=Math.min(i.length,yt);return r>0&&a.has(n)&&e.push({id:"kortit-1",kind:"flashcards",num:"",title:`K\xE4\xE4nt\xF6kortit \xB7 ${t?.meta?.title||""}`.trim(),meta:`${r} korttia`}),e}function y(t){let e=f.findIndex(s=>s.id===t);return e>=0?e:0}function fe(){let e=(g?.meta||{}).title||"Oppitunti";return`
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
      <h1 class="dk__title">${d(e)}</h1>
      <div class="dk__tools">
        <span class="dk__progress-chip" id="dk-progress-chip" aria-live="polite"></span>
      </div>
    </header>`}function ve(){let t=[],e=null;for(let o of f){let l=oe[o.kind]||"Muut";l!==e&&(t.push({title:l,items:[]}),e=l),t[t.length-1].items.push(o)}let s=B(),n=t.map(o=>{let l=`<span class="dk__group-title">${d(o.title)}</span>`,c=o.items.map(u=>{let _=u.id===p.sivuId,h=s[u.id]==="done",k=["dk__row"];_&&k.push("is-active"),h&&k.push("is-done");let m=u.num?`${d(u.num)} `:"";return`
        <button type="button"
                class="${k.join(" ")}"
                data-sivu="${d(u.id)}"
                data-kind="${d(u.kind)}"
                aria-current="${_?"page":"false"}"
                aria-label="${d(u.title)}${h?", suoritettu":""}">
          <span class="dk__row-bullet" aria-hidden="true"></span>
          <span class="dk__row-title">${m}${d(u.title)}</span>
          ${h?'<span class="dk__row-check" aria-hidden="true">\u2713</span>':""}
        </button>`}).join("");return l+c}).join(""),a=(window._userProfile?.nickname||"").trim();if(!a)try{a=(localStorage.getItem("puheo:nickname")||"").trim()}catch{}let i=typeof N=="function"&&N()||"",r=a||i||"Oma sivu";return`
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sis\xE4llys">
      <div class="dk__sidemenu-top">
        <a class="dk__sidemenu-logo" href="#home" data-dk-nav="home" aria-label="Puheo etusivulle"><span class="brand-wordmark">puheo</span></a>
        <div class="dk__sidemenu-course">${d(pe(p.lang))} \xB7 ${d($t(p.kurssiKey))}</div>
      </div>
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sis\xE4llys</span>
        <span class="dk__sidemenu-count">${f.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${n}
      </nav>
      <div class="dk__sidemenu-footer">
        <button type="button" class="dk__sidemenu-user" data-dk-nav="profile" title="${d(r)}">
          <span class="dk__sidemenu-user-text">${d(r)}</span>
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
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`}function ge(){let t=document.getElementById("dk-root");t&&t.addEventListener("click",e=>{let s=e.target.closest("[data-dk-nav]");if(!s)return;let n=s.dataset.dkNav;s.tagName==="A"&&e.preventDefault(),n==="home"?document.querySelector('.sidebar-item[data-nav="home"]')?.click()??(location.hash="#home"):n==="settings"?document.querySelector('.sidebar-item[data-nav="settings"]')?.click():n==="profile"?document.querySelector('.sidebar-user[data-nav="profile"], .sidebar-item[data-nav="profile"]')?.click():n==="logout"&&document.getElementById("sidebar-logout")?.click()})}function xt(){p.sivuId==="teoria"&&x("teoria")}function ye(){let t=g?.teaching||{},e=t.intro_md||"",s=Array.isArray(t.key_points)?t.key_points:[],n=lt(e)||`
    <p class="dk__teoria-p">T\xE4ll\xE4 oppitunnilla ei ole viel\xE4 opetusmateriaalia. Voit siirty\xE4 suoraan harjoituksiin sivuvalikosta.</p>`,a=s.length?`<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista n\xE4m\xE4</p>
         <ol>${s.map(i=>`<li>${d(i)}</li>`).join("")}</ol>
       </aside>`:"";return n+a}function wt(t){let e=ut[t.kind]||ut.flashcards;return`
    <div class="dk__placeholder" data-kind="${d(t.kind)}">
      <p class="dk__placeholder-kind">${d(e.label)}</p>
      <p>${d(e.body)}</p>
    </div>`}var Y=new Map;function St(t){let e=t?.testDef;return e?((Array.isArray(g?.phases)?g.phases:[])[e.sourcePhase]?.items||[]).slice(0,e.count).filter(a=>je.has(a.item_type)):[]}function It(t,e){let s=Y.get(t);return s||(s={submitted:!1,answers:e.map(n=>n.item_type==="mc"?null:n.item_type==="gap_fill"?new Array((String(n.sentence_template||"").match(/\{\d+\}/g)||[]).length).fill(""):""),results:e.map(()=>null),scoreCorrect:0},Y.set(t,s)),s}function At(t){let e=St(t);if(e.length===0)return`
      <div class="dk__placeholder" data-kind="testi">
        <p>T\xE4ll\xE4 testill\xE4 ei ole viel\xE4 kohtia.</p>
      </div>`;let s=It(t.id,e),n=t.testDef?.label||t.title||"Testi",a=e.map((o,l)=>be(o,l,s)).join(""),i=s.submitted?$e(e,s):"",r=s.submitted?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu \u2192</button>`:'<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>';return`
    <section class="dk__testi" data-sivu="${d(t.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi \xB7 ${d(n)}</span>
        <span class="dk__exercise-score">${e.length} kohtaa</span>
      </header>
      ${i}
      <ol class="dk__testi-list">${a}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${r}</div>
    </section>`}function be(t,e,s){let n=s.submitted,a=s.results[e],i=t.item_type==="translate"?t.source||"":t.item_type==="typed"?t.prompt||"":t.item_type==="gap_fill"?null:t.stem||"",r=n?`<span class="dk__feedback-chip ${a?.correct?"is-correct":"is-wrong"}">${a?.correct?"Oikein":"Viel\xE4 ei"}</span>`:`<span class="dk__testi-itemnum">${e+1}</span>`,o="";switch(t.item_type){case"mc":{let c=n?a?.choiceIndex:s.answers[e]===null?-1:s.answers[e],u=t.correct_index;o=`
        <p class="dk__exercise-stem dk__testi-stem">${d(i)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(t.choices||[]).map((_,h)=>{let k=c===h,m=h===u,v=["dk__choice"];return n?k&&m?v.push("is-correct"):k&&!m?v.push("is-wrong"):m&&v.push("is-revealed"):k&&v.push("is-selected"),`
              <li>
                <button type="button" class="${v.join(" ")}"
                        data-testi-item="${e}" data-choice="${h}"
                        ${n?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+h)}</span>
                  <span class="dk__choice-text">${d(_)}</span>
                </button>
              </li>`}).join("")}
        </ol>`;break}case"typed":case"translate":{let c=n?a?.userAnswer||"":s.answers[e]||"";o=`
        <p class="dk__exercise-stem dk__testi-stem">${d(i)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${e}">Vastauksesi</label>
          <${t.item_type==="translate"?`textarea rows="2" id="dk-testi-input-${e}" class="dk__input dk__input--multiline"`:`input id="dk-testi-input-${e}" type="text" class="dk__input"`}
                  data-testi-item="${e}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${n?"disabled":""}${t.item_type==="translate"?`>${d(c)}</textarea>`:` value="${d(c)}">`}
        </div>`;break}case"gap_fill":{let c=String(t.sentence_template||""),u=n?a?.userAnswer||[]:s.answers[e]||[],_=0,h=d(c).replace(/\{(\d+)\}/g,()=>{let m=u[_]||"",v=`dk-testi-${e}-gap-${_}`,C=_;return _++,`<input id="${v}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${e}" data-testi-gap="${C}"
                       autocomplete="off" spellcheck="false"
                       value="${d(m)}" ${n?"disabled":""}>`}),k=Array.isArray(t.word_bank)&&t.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
             ${t.word_bank.map(m=>`<li><span>${d(m)}</span></li>`).join("")}
           </ul>`:"";o=`<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${h}</p>${k}`;break}default:o=`<p>${d(i)}</p>`}let l=n?`<div class="dk__testi-reveal">
         ${a?.correct?"":`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${d(Ut(t)||"")}</p>`}
         ${t.explanation?`<p class="dk__feedback-text">${d(t.explanation)}</p>`:""}
       </div>`:"";return`
    <li class="dk__testi-item ${n?a?.correct?"is-correct":"is-wrong":""}" data-testi-item="${e}">
      <div class="dk__testi-itemhead">
        ${r}
      </div>
      <div class="dk__testi-itembody">
        ${o}
        ${l}
      </div>
    </li>`}function $e(t,e){let s=t.length,n=e.scoreCorrect,a=s?Math.round(n/s*100):0,i=a>=80?"Hyvin meni.":a>=50?"Hyv\xE4 alku. Kertaa virheelliset kohdat.":"Kertaa viel\xE4 ja yrit\xE4 uudelleen.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n} / ${s}</span>
        <span class="dk__testi-summary-pct">${a}%</span>
      </div>
      <p class="dk__testi-summary-headline">${d(i)}</p>
    </div>`}function xe(t,e){return t.map((n,a)=>{switch(n.item_type){case"mc":return e.answers[a];case"typed":case"translate":{let i=document.getElementById(`dk-testi-input-${a}`);return i?i.value:""}case"gap_fill":return[...document.querySelectorAll(`[data-testi-item="${a}"][data-testi-gap]`)].map(r=>r.value);default:return null}})}function pt(){let t=y(p.sivuId),e=f[t],s=document.querySelector(".dk__content .dk__testi");if(!s)return;let n=document.createElement("div");n.innerHTML=At(e),s.replaceWith(n.firstElementChild),Et()}function Et(){let t=document.querySelector(".dk__testi");if(!t)return;let e=t.dataset.sivu,s=f.find(i=>i.id===e),n=St(s),a=It(e,n);t.querySelectorAll(".dk__choice[data-testi-item]").forEach(i=>{i.addEventListener("click",()=>{if(a.submitted)return;let r=Number(i.dataset.testiItem),o=Number(i.dataset.choice);a.answers[r]=o,t.querySelector(`.dk__testi-item[data-testi-item="${r}"]`)?.querySelectorAll(".dk__choice").forEach(c=>{c.classList.toggle("is-selected",Number(c.dataset.choice)===o)})})}),document.getElementById("dk-testi-submit")?.addEventListener("click",()=>{if(a.submitted)return;a.answers=xe(n,a);let i=0;a.results=n.map((r,o)=>{let l=Z(r,a.answers[o]);return l.correct&&i++,l}),a.scoreCorrect=i,a.submitted=!0,x(e),pt(),requestAnimationFrame(()=>{document.querySelector(".dk__testi-summary")?.scrollIntoView({block:"start",behavior:"smooth"})})}),document.getElementById("dk-testi-reset")?.addEventListener("click",()=>{Y.delete(e),pt()}),document.getElementById("dk-testi-next-sivu")?.addEventListener("click",()=>{let i=y(p.sivuId),r=f[i+1];r&&w(r.id)})}var we="puheo:dk:itsearvio",K=[{id:"vocab",text:"Hallitsen t\xE4m\xE4n oppitunnin sanaston."},{id:"grammar",text:"Pystyn k\xE4ytt\xE4m\xE4\xE4n uutta kielioppia omissa lauseissani."},{id:"input",text:"Ymm\xE4rr\xE4n aiheen teksti\xE4 ja keskusteluja."},{id:"output",text:"Voin puhua ja kirjoittaa t\xE4st\xE4 aiheesta espanjaksi."}],Se=["heikko","vajaa","kohtuu","vahva","hallitsen"];function tt(){return`${we}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function et(){try{return JSON.parse(localStorage.getItem(tt())||"null")}catch{return null}}function Lt(t){try{localStorage.setItem(tt(),JSON.stringify(t))}catch{}}var J=new Map;function jt(t){let e=J.get(t);return e||(e={...et()?.ratings||{}},J.set(t,e)),e}function Tt(t){let e=jt(t.id),s=et(),n=!!s,a=K.map(l=>{let c=n?s.ratings?.[l.id]??0:e[l.id]??0,u=[1,2,3,4,5].map(_=>`
      <button type="button"
              class="dk__arvio-btn ${c===_?"is-chosen":""}"
              data-statement="${d(l.id)}"
              data-value="${_}"
              aria-pressed="${c===_}"
              aria-label="${_}, ${d(Se[_-1])}"
              ${n?"disabled":""}>
        <span class="dk__arvio-num">${_}</span>
      </button>`).join("");return`
      <div class="dk__arvio-row" data-statement="${d(l.id)}">
        <p class="dk__arvio-statement">${d(l.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${d(l.text)}">
          ${u}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 \xB7 heikko</span>
          <span>5 \xB7 hallitsen</span>
        </div>
      </div>`}).join(""),i=K.every(l=>Number.isInteger(e[l.id])&&e[l.id]>0),r=n?`<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">P\xE4ivit\xE4 arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`:`<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${i?"":"disabled"}>Tallenna arvio</button>`,o=n?Ie(s):"";return`
    <section class="dk__arvio" data-sivu="${d(t.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${K.length} v\xE4itt\xE4m\xE4\xE4</span>
      </header>
      <p class="dk__arvio-lede">T\xE4m\xE4 on oma kompassisi, ei arvosana. Ole rehellinen, vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${o}
      <div class="dk__arvio-list">${a}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${r}</div>
    </section>`}function Ie(t){let e=t?.ratings||{},s=K.map(i=>e[i.id]).filter(Number.isInteger);if(s.length===0)return"";let n=s.reduce((i,r)=>i+r,0)/s.length,a=n>=4?"Olet vahvalla pohjalla.":n>=3?"Hyv\xE4, suuntaa ty\xF6 heikoimpiin kohtiin.":"Kannattaa kerrata oppitunti ennen seuraavaa.";return`
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${n.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${d(a)}</p>
    </div>`}function _t(){let t=y(p.sivuId),e=f[t],s=document.querySelector(".dk__content .dk__arvio");if(!s)return;let n=document.createElement("div");n.innerHTML=Tt(e),s.replaceWith(n.firstElementChild),Ct()}function Ct(){let t=document.querySelector(".dk__arvio");if(!t)return;let e=t.dataset.sivu,s=jt(e);t.querySelectorAll(".dk__arvio-btn").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.statement,i=Number(n.dataset.value);s[a]=i,t.querySelector(`.dk__arvio-row[data-statement="${a}"]`)?.querySelectorAll(".dk__arvio-btn").forEach(l=>{let c=Number(l.dataset.value)===i;l.classList.toggle("is-chosen",c),l.setAttribute("aria-pressed",c?"true":"false")});let o=document.getElementById("dk-arvio-submit");if(o){let l=K.every(c=>Number.isInteger(s[c.id])&&s[c.id]>0);o.disabled=!l}})}),document.getElementById("dk-arvio-submit")?.addEventListener("click",()=>{let n={ratings:{...s},submittedAt:new Date().toISOString(),lang:p.lang,kurssiKey:p.kurssiKey,lessonIndex:p.lessonIndex};Lt(n),x(e),_t(),q()&&A(`${S}/api/digikirja/itsearvio`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify({lang:p.lang,kurssi:p.kurssiKey,lesson:p.lessonIndex,ratings:n.ratings})}).catch(()=>{})}),document.getElementById("dk-arvio-reset")?.addEventListener("click",()=>{try{localStorage.removeItem(tt())}catch{}J.delete(e),_t()}),document.getElementById("dk-arvio-back")?.addEventListener("click",()=>{location.hash=`#/oppimispolku/${p.lang}/${encodeURIComponent(p.kurssiKey)}`})}var G=new Map,L="know",Mt="again";function z(t){return(Array.isArray(t?.vocab)?t.vocab:[]).slice(0,yt)}function st(){return`${ce}:${p.lang}:${p.kurssiKey}:${p.lessonIndex}`}function nt(){try{let t=localStorage.getItem(st());return t?JSON.parse(t):{}}catch{return{}}}function Ae(t,e){try{let s=nt();s[t]=e,localStorage.setItem(st(),JSON.stringify(s))}catch{}}function Ee(){try{localStorage.removeItem(st())}catch{}}function qt(t){let e=G.get(t);return e||(e={cardIndex:0,flipped:!1},G.set(t,e)),e}function j(t,e){return t?.es?`${e}:${t.es}`:`${e}`}function Kt(t){let e=z(g);if(e.length===0)return'<div class="dk__placeholder"><p>T\xE4m\xE4n oppitunnin sanasto on tyhj\xE4.</p></div>';let s=nt(),n=e.filter((h,k)=>s[j(h,k)]===L).length;if(n===e.length)return`
      <section class="dk__flashpack" data-sivu="${d(t.id)}" data-done="true">
        <header class="dk__exercise-head">
          <span class="dk__exercise-eyebrow">K\xE4\xE4nt\xF6kortit</span>
          <span class="dk__exercise-score">${n} / ${e.length}</span>
        </header>
        <div class="dk__flashdone">
          <p class="dk__flashdone-headline">Pakka k\xE4yty l\xE4pi.</p>
          <p class="dk__flashdone-sub">Voit palata kortteihin my\xF6hemmin, tai nollata edistymisesi ja harjoitella uudelleen.</p>
          <div class="dk__exercise-actions">
            <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-reset">Aloita alusta</button>
            <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-next-sivu">Seuraava sivu \u2192</button>
          </div>
        </div>
      </section>`;let i=qt(t.id),r=Math.min(i.cardIndex,e.length-1),l=Rt(e,s,r)[0]??r,c=e[l],u=j(c,l),_=s[u]||null;return`
    <section class="dk__flashpack" data-sivu="${d(t.id)}" data-index="${l}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${l+1} / ${e.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${n} / ${e.length} hallinnassa</span>
      </header>
      ${Le(c,u,i.flipped,_)}
      <p class="dk__flash-hint">${i.flipped?"Merkitse kortti hallinnaksi tai palaa siihen my\xF6hemmin.":"Yrit\xE4 muistaa ensin omasta p\xE4\xE4st\xE4si. Sitten k\xE4\xE4nn\xE4 kortti."}</p>
    </section>`}function Rt(t,e,s){let n=[];for(let a=s;a<t.length;a++){let i=j(t[a],a);e[i]!==L&&n.push(a)}for(let a=0;a<s;a++){let i=j(t[a],a);e[i]!==L&&n.push(a)}return n}function Le(t,e,s,n){let a=t.gender?`<span class="dk__flashcard-tag">${d(t.gender==="m"?"Maskuliini":t.gender==="f"?"Feminiini":t.gender)}</span>`:"",i=n===Mt?'<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>':n===L?'<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>':"";return`
    <div class="dk__flashcard ${s?"is-flipped":""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${d(e)}"
         aria-pressed="${s?"true":"false"}"
         aria-label="${d(s?"N\xE4yt\xE4 etupuoli":"K\xE4\xE4nn\xE4 kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${a}${i}
          </div>
          <p class="dk__flashcard-word">${d(t.es||"")}</p>
          <p class="dk__flashcard-hint-pad">Yrit\xE4 muistaa, sitten k\xE4\xE4nn\xE4.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${i}
          </div>
          <p class="dk__flashcard-word">${d(t.fi||"")}</p>
          ${t.example_es?`<p class="dk__flashcard-example"><span lang="es">${d(t.example_es)}</span></p>`:""}
          ${t.example_fi?`<p class="dk__flashcard-example dk__flashcard-example--fi">${d(t.example_fi)}</p>`:""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${s?"":"hidden"}>Harjoittele viel\xE4</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${s?"":"hidden"}>Tied\xE4n</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${s?"hidden":""}>K\xE4\xE4nn\xE4 kortti</button>
    </div>`}function F(){let t=y(p.sivuId),e=f[t],s=document.querySelector(".dk__content .dk__flashpack");if(!s)return;let n=document.createElement("div");n.innerHTML=Kt(e),s.replaceWith(n.firstElementChild),Ht()}function Ht(){let t=document.querySelector(".dk__flashpack");if(!t)return;let e=t.dataset.sivu;if(document.getElementById("dk-flash-reset")?.addEventListener("click",()=>{Ee(),G.delete(e),F()}),document.getElementById("dk-flash-next-sivu")?.addEventListener("click",()=>{let l=y(p.sivuId),c=f[l+1];c&&w(c.id)}),t.dataset.done==="true")return;let s=qt(e),n=Number(t.dataset.index),a=z(g)[n];if(!a)return;let i=j(a,n),r=()=>{s.flipped=!s.flipped,F()};document.getElementById("dk-flashcard")?.addEventListener("click",r),document.getElementById("dk-flashcard")?.addEventListener("keydown",l=>{(l.key===" "||l.key==="Enter")&&(l.preventDefault(),r())}),document.getElementById("dk-flash-flip")?.addEventListener("click",r);let o=l=>{Ae(i,l),s.flipped=!1;let c=nt(),u=z(g);u.length>0&&u.every((k,m)=>c[j(k,m)]===L)&&x(e);let h=Rt(u,c,n+1<u.length?n+1:0);s.cardIndex=h[0]??n,F()};document.getElementById("dk-flash-again")?.addEventListener("click",()=>o(Mt)),document.getElementById("dk-flash-know")?.addEventListener("click",()=>o(L))}var kt=new Map,je=new Set(["mc","typed","gap_fill","translate"]),Te=new Set(["mc","typed","gap_fill","translate","match"]);function T(t){if(!t||t.kind!=="tehtava")return null;let e=/^phase-(\d+)$/.exec(t.id);if(!e)return null;let s=Number(e[1]);return(Array.isArray(g?.phases)?g.phases:[])[s]||null}function Ot(t,e){let s=kt.get(t);return s||(s={itemIndex:0,answered:new Array(e.length).fill(null),scoreCorrect:0,scoreTotal:0},kt.set(t,s)),s}function Bt(t){let e=T(t);if(!e)return wt(t);let s=Array.isArray(e.items)?e.items:[];if(s.length===0)return'<div class="dk__placeholder"><p>T\xE4ll\xE4 vaiheella ei ole teht\xE4vi\xE4.</p></div>';let n=s[0].item_type;if(n==="writing")return Nt(t,e,s);if(n==="reading_mc")return Ft(t,e,s);if(!Te.has(n))return`
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">Teht\xE4v\xE4tyyppi "${d(n)}"</p>
        <p>T\xE4m\xE4 teht\xE4v\xE4tyyppi avautuu pian. Voit jatkaa muista vaiheista sivuvalikosta.</p>
      </div>`;let a=Ot(t.id,s),i=Math.min(a.itemIndex,s.length-1),r=s[i],o=a.answered[i];return`
    <section class="dk__exercise" data-sivu="${d(t.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teht\xE4v\xE4 ${i+1} / ${s.length}</span>
        ${a.scoreTotal>0?`<span class="dk__exercise-score" aria-label="Tulos">${a.scoreCorrect} / ${a.scoreTotal}</span>`:""}
      </header>
      ${Ke(r,o)}
      ${Ne(r,o,i,s.length)}
    </section>`}var ht=new Map;function Pt(t){let e=ht.get(t);return e||(e={promptIdx:0,text:"",submitted:!1,result:null,loading:!1,error:null},ht.set(t,e)),e}function Nt(t,e,s){let n=Pt(t.id),a=s[Math.min(n.promptIdx,s.length-1)]||s[0],i=a.min_words||50,r=a.max_words||120,o=e.instruction||"",l=s.length>1&&!n.submitted?`<div class="dk__writing-switcher" role="tablist" aria-label="Valitse aihe">
         ${s.map((u,_)=>`
           <button type="button"
                   class="dk__writing-tab ${_===n.promptIdx?"is-active":""}"
                   data-prompt-idx="${_}"
                   role="tab"
                   aria-selected="${_===n.promptIdx}">
             Aihe ${_+1}
           </button>`).join("")}
       </div>`:"",c=n.submitted&&n.result?Me(n):Ce(a,n,i,r,o);return`
    <section class="dk__writing" data-sivu="${d(t.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kirjoitusteht\xE4v\xE4</span>
        <span class="dk__exercise-score" aria-label="Tavoite">${i}\u2013${r} sanaa</span>
      </header>
      ${l}
      ${c}
    </section>`}function Ce(t,e,s,n,a){let i=d(t.prompt||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),r=X(e.text),o=r>=s&&r<=n?"dk__writing-counter is-ok":r>n?"dk__writing-counter is-over":"dk__writing-counter is-short",l=r<s||e.loading,c=e.loading?"Arvioidaan\u2026":"L\xE4het\xE4 arvioitavaksi",u=a?`<p class="dk__writing-instruction">${d(a)}</p>`:"",_=e.error?`<p class="dk__writing-error" role="alert">${d(e.error)}</p>`:"";return`
    ${u}
    <p class="dk__writing-prompt">${i}</p>
    <div class="dk__writing-composer">
      <label class="dk__input-label" for="dk-writing-input">Vastauksesi</label>
      <textarea id="dk-writing-input"
                class="dk__input dk__input--multiline dk__writing-textarea"
                rows="12"
                autocomplete="off"
                spellcheck="false"
                placeholder="Kirjoita vastauksesi t\xE4h\xE4n\u2026"
                ${e.loading?"disabled":""}>${d(e.text)}</textarea>
      <div class="dk__writing-meta">
        <span class="${o}" aria-live="polite">
          <strong id="dk-writing-words">${r}</strong> / ${s}\u2013${n} sanaa
        </span>
        <span class="dk__writing-rubric">Arvioidaan YTL-rubriikilla</span>
      </div>
      ${_}
      <div class="dk__exercise-actions">
        <button type="button"
                class="dk__btn dk__btn--primary"
                id="dk-writing-submit"
                ${l?"disabled":""}>
          ${d(c)}
        </button>
      </div>
    </div>`}function Me(t){let e=t.result||{},s=e.finalScore!=null?e.finalScore:"\u2014",n=e.maxScore!=null?e.maxScore:"",a=e.ytlGrade?`<span class="dk__writing-grade">YTL ${d(String(e.ytlGrade))}</span>`:"",i=Array.isArray(e.errors)?e.errors:[],r=Array.isArray(e.annotations)?e.annotations.filter(u=>u?.type==="positive"):[],o=e.overall_feedback_fi?`<p class="dk__writing-overall">${d(e.overall_feedback_fi)}</p>`:"",l=i.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Korjattavaa</h3>
         <ul class="dk__writing-errors">
           ${i.slice(0,6).map(u=>`
             <li>
               <span class="dk__writing-error-wrong">${d(u.excerpt||u.original||"")}</span>
               <span aria-hidden="true">\u2192</span>
               <span class="dk__writing-error-right">${d(u.corrected||u.correct||"")}</span>
               ${u.explanation_fi?`<p class="dk__writing-error-expl">${d(u.explanation_fi)}</p>`:""}
             </li>`).join("")}
         </ul>
       </div>`:"",c=r.length?`<div class="dk__writing-section">
         <h3 class="dk__writing-section-title">Hyvin tehty</h3>
         <ul class="dk__writing-positives">
           ${r.slice(0,4).map(u=>`<li>${d(u.comment_fi||"")}</li>`).join("")}
         </ul>
       </div>`:"";return`
    <div class="dk__writing-result">
      <div class="dk__writing-score">
        <span class="dk__writing-score-num">${d(String(s))}</span>
        <span class="dk__writing-score-denom">/ ${d(String(n))}</span>
        ${a}
      </div>
      ${o}
      ${c}
      ${l}
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--ghost" id="dk-writing-retry">Kirjoita uudestaan</button>
        <button type="button" class="dk__btn dk__btn--primary" id="dk-writing-next">Seuraava sivu \u2192</button>
      </div>
    </div>`}function X(t){let e=String(t||"").trim();return e?e.split(/\s+/).filter(Boolean).length:0}function qe(t){let e=t.min_words||50,s=t.max_words||120,n=s>=200?"long":"short";return{taskType:n,points:n==="long"?99:33,charMin:Math.max(60,Math.round(e*6)),charMax:Math.max(120,Math.round(s*6)),situation:"",prompt:t.prompt||"",requirements:[],textType:n==="long"?"pidempi kirjoitelma":"lyhyt kirjoitelma"}}function Vt(){let t=document.querySelector(".dk__writing");if(!t)return;let e=t.dataset.sivu,s=f.find(c=>c.id===e);if(!s)return;let n=T(s);if(!n)return;let a=Array.isArray(n.items)?n.items:[],i=Pt(e);t.querySelectorAll(".dk__writing-tab").forEach(c=>{c.addEventListener("click",()=>{let u=Number(c.dataset.promptIdx);Number.isInteger(u)&&u!==i.promptIdx&&(i.promptIdx=u,i.text="",i.error=null,O(e))})});let r=t.querySelector("#dk-writing-input"),o=t.querySelector("#dk-writing-words"),l=t.querySelector("#dk-writing-submit");r?.addEventListener("input",()=>{i.text=r.value;let c=X(i.text);o&&(o.textContent=c);let u=a[i.promptIdx]||a[0],_=u.min_words||50,h=u.max_words||120;l&&(l.disabled=c<_||i.loading);let k=t.querySelector(".dk__writing-counter");k&&(k.classList.remove("is-ok","is-over","is-short"),c>h?k.classList.add("is-over"):c>=_?k.classList.add("is-ok"):k.classList.add("is-short"))}),l?.addEventListener("click",async()=>{if(i.loading)return;let c=a[i.promptIdx]||a[0],u=c.min_words||50;if(!(X(i.text)<u)){i.loading=!0,i.error=null,O(e);try{let _=qe(c),h={"Content-Type":"application/json"};q()&&Object.assign(h,I());let k=await A(`${S}/api/grade-writing`,{method:"POST",headers:h,body:JSON.stringify({task:_,studentText:i.text})});if(!k.ok){let v=await k.json().catch(()=>({}));throw new Error(v?.error||`Arvionti ep\xE4onnistui (${k.status})`)}let m=await k.json();if(!m?.result)throw new Error("Ei tulosta palvelimelta");i.result=m.result,i.submitted=!0,x(e)}catch(_){i.error=String(_?.message||"Arvionti ei nyt vastaa, yrit\xE4 hetken p\xE4\xE4st\xE4.")}finally{i.loading=!1,O(e)}}}),t.querySelector("#dk-writing-retry")?.addEventListener("click",()=>{i.submitted=!1,i.result=null,i.text="",O(e)}),t.querySelector("#dk-writing-next")?.addEventListener("click",()=>{let c=y(e),u=f[c+1];u&&w(u.id)})}function O(t){let e=document.querySelector(`.dk__writing[data-sivu="${t}"]`);if(!e)return;let s=f.find(o=>o.id===t),n=T(s);if(!s||!n)return;let a=Array.isArray(n.items)?n.items:[],i=Nt(s,n,a),r=document.createElement("div");r.innerHTML=i,e.replaceWith(r.firstElementChild),Vt()}var mt=new Map;function Dt(t,e){let s=mt.get(t);return s||(s={itemIdx:0,answers:e.map(n=>new Array((n.questions||[]).length).fill(null)),submitted:e.map(()=>!1)},mt.set(t,s)),s}function Ft(t,e,s){let n=Dt(t.id,s),a=Math.min(n.itemIdx,s.length-1),i=s[a]||{},r=Array.isArray(i.questions)?i.questions:[],o=!!n.submitted[a],l=n.answers[a]||[],c=o?l.reduce((m,v,C)=>m+(v===r[C]?.correct_index?1:0),0):0,u=d(i.passage||"").split(/\n\n+/).map(m=>`<p>${m.replace(/\n/g,"<br>")}</p>`).join(""),_=r.map((m,v)=>{let C=Array.isArray(m.choices)?m.choices:[],at=l[v],P=m.correct_index;return`
      <div class="dk__reading-q" data-qi="${v}">
        <p class="dk__reading-q-stem">${v+1}. ${d(m.question_fi||"")}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${C.map((Xt,M)=>{let it=at===M,Zt=o&&M===P,Qt=o&&it&&M!==P,H=["dk__choice"];return Qt?H.push("is-wrong"):Zt?H.push("is-correct"):it&&!o&&H.push("is-selected"),`
              <li>
                <button type="button"
                        class="${H.join(" ")}"
                        data-qi="${v}" data-ci="${M}"
                        ${o?"disabled":""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+M)}</span>
                  <span class="dk__choice-text">${d(Xt)}</span>
                </button>
              </li>`}).join("")}
        </ol>
        ${o&&m.explanation_fi?`<p class="dk__reading-expl ${at===P?"is-correct":"is-wrong"}">${d(m.explanation_fi)}</p>`:""}
      </div>`}).join(""),h=a>=s.length-1,k=o?`<div class="dk__feedback" aria-live="polite">
         <span class="dk__feedback-chip ${c===r.length?"is-correct":"is-wrong"}">
           ${c} / ${r.length} oikein
         </span>
       </div>
       <div class="dk__exercise-actions">
         <button type="button" class="dk__btn dk__btn--primary" id="dk-reading-next">
           ${h?"Vaihe valmis \u2192":"Seuraava teksti \u2192"}
         </button>
       </div>`:`<div class="dk__exercise-actions">
         <button type="button"
                 class="dk__btn dk__btn--primary"
                 id="dk-reading-submit"
                 ${l.some(m=>m==null)?"disabled":""}>
           Tarkista vastaukset
         </button>
       </div>`;return`
    <section class="dk__reading" data-sivu="${d(t.id)}" data-item="${a}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Teksti ${a+1} / ${s.length}</span>
        <span class="dk__exercise-score" aria-label="Kysymyksi\xE4">${r.length} kysymyst\xE4</span>
      </header>
      <div class="dk__reading-passage">${u}</div>
      <div class="dk__reading-questions">${_}</div>
      ${k}
    </section>`}function Wt(){let t=document.querySelector(".dk__reading");if(!t)return;let e=t.dataset.sivu,s=f.find(o=>o.id===e);if(!s)return;let n=T(s);if(!n)return;let a=Array.isArray(n.items)?n.items:[],i=Dt(e,a),r=Number(t.dataset.item)||0;t.querySelectorAll(".dk__choice").forEach(o=>{o.addEventListener("click",()=>{if(i.submitted[r])return;let l=Number(o.dataset.qi),c=Number(o.dataset.ci);i.answers[r][l]=c,W(e)})}),t.querySelector("#dk-reading-submit")?.addEventListener("click",()=>{i.answers[r].some(o=>o==null)||(i.submitted[r]=!0,i.submitted.every(Boolean)&&x(e),W(e))}),t.querySelector("#dk-reading-next")?.addEventListener("click",()=>{if(r<a.length-1)i.itemIdx=r+1,W(e);else{let o=y(e),l=f[o+1];l&&w(l.id)}})}function W(t){let e=document.querySelector(`.dk__reading[data-sivu="${t}"]`);if(!e)return;let s=f.find(o=>o.id===t),n=T(s);if(!s||!n)return;let a=Array.isArray(n.items)?n.items:[],i=Ft(s,n,a),r=document.createElement("div");r.innerHTML=i,e.replaceWith(r.firstElementChild),Wt()}function Ke(t,e){switch(t.item_type){case"mc":return Re(t,e);case"typed":return He(t,e);case"gap_fill":return Oe(t,e);case"translate":return Be(t,e);case"match":return Pe(t,e);default:return`<p class="dk__teoria-p">Teht\xE4v\xE4tyyppi \u201D${d(t.item_type)}\u201D ei ole viel\xE4 k\xE4ytett\xE4viss\xE4.</p>`}}function Re(t,e){let s=Array.isArray(t.choices)?t.choices:[],n=Number.isInteger(t.correct_index)?t.correct_index:-1,a=!!e,i=e?.choiceIndex;return`
    <p class="dk__exercise-stem">${d(t.stem||"")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${s.map((r,o)=>{let l=a&&i===o,c=a&&o===n,u=["dk__choice"];return l&&c?u.push("is-correct"):l&&!c?u.push("is-wrong"):a&&c&&u.push("is-revealed"),`
          <li>
            <button type="button" class="${u.join(" ")}"
                    data-choice="${o}"
                    ${a?"disabled":""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65+o)}</span>
              <span class="dk__choice-text">${d(r)}</span>
            </button>
          </li>`}).join("")}
    </ol>`}function He(t,e){let s=t.hint||"",n=e?.userAnswer||"",a=!!e;return`
    <p class="dk__exercise-stem">${d(t.prompt||"")}</p>
    ${s?`<p class="dk__exercise-hint">${d(s)}</p>`:""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${d(n)}"
             ${a?"disabled":""}>
    </div>`}function Oe(t,e){let s=String(t.sentence_template||""),n=(s.match(/\{(\d+)\}/g)||[]).length,a=e?.userAnswer||new Array(n).fill(""),i=!!e,r=0,o=d(s).replace(/\{(\d+)\}/g,()=>{let c=a[r]||"",u=`dk-gap-${r}`;return r++,`<input id="${u}" type="text" class="dk__input dk__input--gap"
                   data-gap="${r-1}" autocomplete="off" spellcheck="false"
                   value="${d(c)}" ${i?"disabled":""}>`}),l=Array.isArray(t.word_bank)&&t.word_bank.length?`<ul class="dk__wordbank" aria-label="Sanapankki">
         ${t.word_bank.map(c=>`
           <li>
             <button type="button" class="dk__wordbank-chip"
                     data-word="${d(c)}"
                     ${i?"disabled":""}>
               ${d(c)}
             </button>
           </li>`).join("")}
       </ul>`:"";return`
    <p class="dk__exercise-stem dk__exercise-stem--gap">${o}</p>
    ${l}`}function Be(t,e){let s=t.direction==="es_to_fi"?"espanjasta suomeksi":t.direction==="fi_to_es"?"suomesta espanjaksi":"k\xE4\xE4nn\xF6s",n=e?.userAnswer||"",a=!!e;return`
    <p class="dk__exercise-eyebrow-tag">K\xE4\xE4nn\xF6s, ${d(s)}</p>
    <p class="dk__exercise-stem">${d(t.source||t.prompt||"")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${a?"disabled":""}>${d(n)}</textarea>
    </div>`}function Pe(t,e){let s=Array.isArray(t.pairs)?t.pairs:[];if(e){let i=(Array.isArray(e.rows)?e.rows:[]).map(r=>`
      <li class="dk__match-result ${r.ok?"is-correct":"is-wrong"}">
        <span class="dk__match-result-left">${d(r.left)}</span>
        <span class="dk__match-result-arrow" aria-hidden="true">\u2192</span>
        <span class="dk__match-result-right">${d(r.studentRight||"\u2014")}</span>
        ${r.ok?"":`<span class="dk__match-result-fix">oikein: ${d(r.correctRight)}</span>`}
      </li>`).join("");return`
      <p class="dk__exercise-stem">Yhdist\xE4misteht\xE4v\xE4</p>
      <p class="dk__match-score">${e.correctCount} / ${e.total} oikein</p>
      <ul class="dk__match-results">${i}</ul>`}let n=de(s.map(a=>a.right));return`
    <p class="dk__exercise-stem">Valitse vasemmalta sana, sitten sen pari oikealta.</p>
    <div class="dk__match" data-match>
      <div class="dk__match-cols">
        <ul class="dk__match-col" data-col="left"${t.left_label?` aria-label="${d(t.left_label)}"`:""}>
          ${s.map((a,i)=>`
            <li>
              <button type="button" class="dk__match-cell" data-side="left" data-idx="${i}">
                <span class="dk__match-cell-text">${d(a.left)}</span>
                <span class="dk__match-cell-slot" data-slot></span>
              </button>
            </li>`).join("")}
        </ul>
        <ul class="dk__match-col" data-col="right"${t.right_label?` aria-label="${d(t.right_label)}"`:""}>
          ${n.map(a=>`
            <li>
              <button type="button" class="dk__match-cell" data-side="right" data-val="${d(a)}">
                ${d(a)}
              </button>
            </li>`).join("")}
        </ul>
      </div>
    </div>`}function Ne(t,e,s,n){if(!e)return`
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;let a=e.correct,i=a?"is-correct":"is-wrong",r=a?"Oikein":"Viel\xE4 ei aivan",o=Ve(t,e),l=s>=n-1;return`
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${i}">${r}</span>
      ${o}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${l?"Vaihe valmis \u2192":"Seuraava \u2192"}
      </button>
    </div>`}function Ve(t,e){let s=Ut(t),n=s?`<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${d(s)}</p>`:"",a=t.explanation?`<p class="dk__feedback-text">${d(t.explanation)}</p>`:"",i=e?.accentHint?`<p class="dk__feedback-text dk__feedback-hint">${d(e.accentHint)}</p>`:"";return`${n}${i}${a}`}function Ut(t){switch(t.item_type){case"mc":return Array.isArray(t.choices)&&Number.isInteger(t.correct_index)?t.choices[t.correct_index]:"";case"typed":return Array.isArray(t.accept)&&t.accept[0]||"";case"translate":return Array.isArray(t.accept)&&t.accept[0]||"";case"gap_fill":{let e=String(t.sentence_template||""),s=Array.isArray(t.answers)?t.answers:[],n=0;return e.replace(/\{(\d+)\}/g,()=>{let a=s[n++];return Array.isArray(a)&&a[0]||"\u2014"})}case"match":return"";default:return""}}function Z(t,e){switch(t.item_type){case"mc":{let s=Number(e);return{correct:s===t.correct_index,choiceIndex:s}}case"typed":case"translate":{let s=String(e||"").trim(),n=Array.isArray(t.accept)?t.accept:[];for(let a of n){let i=V(s,a,p.lang||"es");if(i.ok)return{correct:!0,userAnswer:s,accentHint:i.hint||null}}return{correct:!1,userAnswer:s}}case"gap_fill":{let s=Array.isArray(e)?e:[],n=Array.isArray(t.answers)?t.answers:[],a=!0;for(let i=0;i<n.length;i++){let r=Array.isArray(n[i])?n[i]:[n[i]],o=String(s[i]||"").trim(),l=!1;for(let c of r)if(V(o,String(c),p.lang||"es").ok){l=!0;break}if(!l){a=!1;break}}return{correct:a,userAnswer:s}}case"match":{let s=Array.isArray(t.pairs)?t.pairs:[],n=Array.isArray(e)?e:[],a=0,i=s.map((r,o)=>{let l=n[o]||"",c=ot(r.left,l,r.left,r.right);return c&&a++,{left:r.left,studentRight:l,correctRight:r.right,ok:c}});return{correct:s.length>0&&a===s.length,userAnswer:n,rows:i,correctCount:a,total:s.length}}default:return{correct:!1}}}function De(t){let e=document.querySelector(".dk__exercise");if(!e)return null;switch(t.item_type){case"typed":case"translate":{let s=e.querySelector("#dk-input");return s?s.value:""}case"gap_fill":return[...e.querySelectorAll(".dk__input--gap")].map(s=>s.value);case"match":{let s=[];return e.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(n=>{s[Number(n.dataset.idx)]=n.dataset.assigned||""}),s}default:return null}}function U(){let t=y(p.sivuId),e=f[t],s=document.querySelector(".dk__content .dk__exercise");if(!s)return;let n=document.createElement("div");n.innerHTML=Bt(e),s.replaceWith(n.firstElementChild),Yt()}function Yt(){let t=document.querySelector(".dk__exercise");if(!t)return;let e=t.dataset.sivu,s=f.find(c=>c.id===e),n=T(s);if(!n)return;let a=n.items||[],i=Number(t.dataset.index),r=a[i];if(!r)return;let o=Ot(e,a);if(t.querySelectorAll(".dk__choice").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[i])return;let u=Number(c.dataset.choice),_=Z(r,u);o.answered[i]=_,_.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&x(e),U()})}),document.getElementById("dk-check")?.addEventListener("click",()=>{if(o.answered[i])return;let c=De(r),u=Z(r,c);o.answered[i]=u,u.correct&&o.scoreCorrect++,o.scoreTotal++,o.scoreTotal>=a.length&&x(e),U()}),t.querySelector("#dk-input")?.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&!o.answered[i]&&(c.preventDefault(),document.getElementById("dk-check")?.click())}),t.querySelectorAll(".dk__wordbank-chip").forEach(c=>{c.addEventListener("click",()=>{if(o.answered[i])return;let u=c.dataset.word||"",_=[...t.querySelectorAll(".dk__input--gap")],h=_.find(k=>!k.value.trim())||_[_.length-1];h&&(h.value=u,h.focus())})}),r.item_type==="match"&&!o.answered[i]){let c=null,u=h=>{t.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(k=>k.classList.remove("is-active")),h&&h.classList.add("is-active"),c=h},_=h=>{h&&(t.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(k=>{if(k.dataset.assigned===h){delete k.dataset.assigned,k.classList.remove("is-assigned");let m=k.querySelector("[data-slot]");m&&(m.textContent="")}}),t.querySelectorAll('.dk__match-cell[data-side="right"]').forEach(k=>{k.dataset.val===h&&k.classList.remove("is-assigned")}))};t.querySelectorAll('.dk__match-cell[data-side="left"]').forEach(h=>{h.addEventListener("click",()=>{u(h===c?null:h)})}),t.querySelectorAll('.dk__match-cell[data-side="right"]').forEach(h=>{h.addEventListener("click",()=>{if(!c)return;let k=h.dataset.val;_(c.dataset.assigned),_(k),c.dataset.assigned=k,c.classList.add("is-assigned");let m=c.querySelector("[data-slot]");m&&(m.textContent=k),h.classList.add("is-assigned"),u(null)})})}document.getElementById("dk-next-item")?.addEventListener("click",()=>{if(i<a.length-1)o.itemIndex=i+1,U();else{let c=y(p.sivuId),u=f[c+1];u&&w(u.id)}})}function Jt(){let t=g?.meta||{},e=y(p.sivuId),s=f[e],n=e>0?f[e-1]:null,a=e<f.length-1?f[e+1]:null,i=[$t(t.course_key||p.kurssiKey),`Oppitunti ${t.lesson_index||p.lessonIndex}`].filter(Boolean).join(" \xB7 "),r=s.kind==="teoria"?`<em>${d(s.title)}</em>`:`${s.num?`${d(s.num)} \xB7 `:""}${d(s.title)}`,o=s.kind==="teoria"?ye():s.kind==="tehtava"?Bt(s):s.kind==="flashcards"?Kt(s):s.kind==="testi"?At(s):s.kind==="itsearviointi"?Tt(s):wt(s);return`
    <main class="dk__content" id="dk-content" tabindex="-1">
      <p class="dk__page-meta">${d(i)}</p>
      <h2 class="dk__page-title">${r}</h2>
      ${o}
      ${Fe(n,a,"bottom")}
    </main>`}function Fe(t,e,s){let n=`dk__prevnext dk__prevnext--${s}`,a=t?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${d(t.id)}">
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">${d(t.num?t.num+" \xB7 "+t.title:t.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">\u2190 Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`,i=e?`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${d(e.id)}">
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">${d(e.num?e.num+" \xB7 "+e.title:e.title)}</span>
       </button>`:`<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava \u2192</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;return`<div class="${n}">${a}${i}</div>`}function We(){return`
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
    </div>`}function Ue(t){return`
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
            <p>${d(String(t?.message||t||"Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${d(p.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`}function R(t){let e=document.getElementById("dk-root");if(!e)return;e.dataset.sidemenu=t;let s=document.getElementById("dk-toggle-sidemenu");s&&s.setAttribute("aria-pressed",t===$?"true":"false")}function Ye(){let t=document.getElementById("dk-toggle-sidemenu"),e=document.getElementById("dk-sidemenu-backdrop");t?.addEventListener("click",()=>{let s=document.getElementById("dk-root");if(window.matchMedia("(max-width: 1023px)").matches){let a=s.dataset.sidemenu===E?$:E;R(a)}else{let a=s.dataset.sidemenu===$?E:$;R(a),ue(a)}}),e?.addEventListener("click",()=>{R($)})}function w(t){if(!t||t===p.sivuId||f.findIndex(r=>r.id===t)<0)return;p.sivuId=t;let s=`#/oppitunti/${p.lang}/${encodeURIComponent(p.kurssiKey)}/${p.lessonIndex}/${encodeURIComponent(t)}`;location.hash!==s&&history.replaceState(null,"",s);let n=document.getElementById("dk-root");if(!n)return;let a=n.querySelector(".dk__sidemenu-list");a&&a.querySelectorAll(".dk__row").forEach(r=>{let o=r.dataset.sivu===t;r.classList.toggle("is-active",o),r.setAttribute("aria-current",o?"page":"false")});let i=n.querySelector(".dk__content");if(i){let r=document.createElement("div");r.innerHTML=Jt(),i.replaceWith(r.firstElementChild),zt()}window.matchMedia("(max-width: 1023px)").matches&&R($),Gt(),xt(),Q(),document.getElementById("dk-content")?.focus({preventScroll:!1})}function Je(){document.getElementById("dk-sidemenu-list")?.addEventListener("click",t=>{let e=t.target.closest(".dk__row");e&&w(e.dataset.sivu)})}function Gt(){let t=document.getElementById("dk-sidemenu-list");if(!t)return;let e=t.querySelector(".dk__row.is-active");e&&requestAnimationFrame(()=>{try{e.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}catch{let s=e.offsetTop-t.clientHeight/2+e.clientHeight/2;t.scrollTop=Math.max(0,s)}})}function zt(){document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach(t=>{t.addEventListener("click",()=>w(t.dataset.sivu))}),Yt(),Ht(),Et(),Ct(),Vt(),Wt()}function Ge(){bt=!0}async function ze(t={}){bt||Ge(),p.lang=t.lang||p.lang,p.kurssiKey=t.kurssiKey||p.kurssiKey,p.lessonIndex=Number(t.lessonIndex)||p.lessonIndex,p.sivuId=t.sivuId||p.sivuId||"teoria";let e=document.getElementById("screen-digikirja");if(!e)return;e.innerHTML=We(),rt("screen-digikirja"),import("./app-sidebarShell-O3IKFPA5.js").then(n=>n.setSidebarMode("book"));let s=`${p.lang}/${p.kurssiKey}/${p.lessonIndex}`;D=s;try{let[n]=await Promise.all([ke(p),he(p)]);if(D!==s)return;g=n,f=me(n),f.some(r=>r.id===p.sivuId)||(p.sivuId=f[0]?.id||"teoria");let i=window.matchMedia("(max-width: 1023px)").matches?$:le();e.innerHTML=`
      <div class="dk" id="dk-root" data-sidemenu="${i}">
        ${fe()}
        <div class="dk__body">
          ${ve()}
          ${Jt()}
        </div>
      </div>`,R(i),Ye(),Je(),ge(),zt(),Gt(),xt(),Q()}catch(n){if(D!==s)return;e.innerHTML=Ue(n)}}function ns(t){let e=/^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(t||location.hash);return e?(ze({lang:e[1].toLowerCase(),kurssiKey:decodeURIComponent(e[2]),lessonIndex:Number(e[3]),sivuId:decodeURIComponent(e[4])}),!0):!1}export{Ge as initDigikirja,ze as showDigikirja,ns as tryRouteDigikirja};
//# sourceMappingURL=app-digikirja-JFCW2XZB.js.map
